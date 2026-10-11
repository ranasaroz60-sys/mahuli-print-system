
import React, { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Upload, FileText, Search, Printer, CheckCircle, 
  AlertTriangle, Menu, X, Smartphone, Shield, 
  Download, LogOut, Loader2, Lock, CheckSquare, XCircle
} from 'lucide-react';

const supabaseUrl = 'https://mipokqqwyfqzlkpwbyzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcG9rcXF3eWZxemxrcHdieXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NDAwODgsImV4cCI6MjEwNzIxNjA4OH0.nZJAeRMkPIUBTz16XId3u6fHVG1dXa5NqLogCTEVYe0';

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

const SystemContext = createContext();

const generateShortId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const SystemProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isConfigured, setIsConfigured] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAdmin(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAdmin(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const loginAdmin = async (email, password) => {
    if (!supabase) return false;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      addNotification(error.message, 'error');
      return false;
    }
    addNotification('Successfully logged in as Admin', 'success');
    return true;
  };

  const logoutAdmin = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    addNotification('Logged out successfully.', 'info');
  };

  return (
    <SystemContext.Provider value={{
      supabase, isConfigured, session, isAdmin,
      loginAdmin, logoutAdmin, addNotification
    }}>
      {children}
      <NotificationContainer notifications={notifications} />
    </SystemContext.Provider>
  );
};

const NotificationContainer = ({ notifications }) => (
  <div className="fixed bottom-4 right-4 z-50 space-y-2">
    {notifications.map(n => (
      <div key={n.id} className={`p-4 rounded-lg shadow-lg text-white max-w-sm flex items-center space-x-2 animate-in slide-in-from-right-8 fade-in ${
        n.type === 'success' ? 'bg-green-600' : 
        n.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
      }`}>
        {n.type === 'success' && <CheckCircle size={20} />}
        {n.type === 'error' && <AlertTriangle size={20} />}
        <span className="text-sm font-medium">{n.message}</span>
      </div>
    ))}
  </div>
);

const VisualQRCode = ({ value, size = 120 }) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  return (
    <div className="bg-white p-2 rounded-lg border-2 border-blue-100 shadow-sm inline-block">
      <img src={qrUrl} alt={`QR Code for ${value}`} width={size} height={size} className="object-contain" />
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-blue-100 text-blue-800 border-blue-200',
    printing: 'bg-purple-100 text-purple-800 border-purple-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    rejected: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border uppercase ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

const ClientUploadForm = ({ onComplete }) => {
  const { supabase, isConfigured, addNotification } = useContext(SystemContext);
  const [formData, setFormData] = useState({ clientName: '', phone: '', copies: 1, colorMode: 'bw' });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  const maxSizeMB = 10;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!allowedTypes.includes(selectedFile.type)) {
      addNotification('अमान्य फाइल। PDF, JPG, वा PNG मात्र। (Invalid file type)', 'error');
      return;
    }
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      addNotification(`फाइल धेरै ठूलो छ। अधिकतम ${maxSizeMB}MB`, 'error');
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConfigured) {
      addNotification('Database is not configured.', 'error');
      return;
    }
    if (!file) {
      addNotification('कृपया कागजात छान्नुहोस्। (Select a document)', 'error');
      return;
    }
    
    setIsSubmitting(true);
    const shortId = generateShortId();
    const fileExt = file.name.split('.').pop();
    const storagePath = `pending/${shortId}_${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file);

      if (uploadError) throw new Error('File upload failed: ' + uploadError.message);

      const expiresAt = new Date(Date.now() + 86400000);
      const fileSizeMb = parseFloat((file.size / (1024 * 1024)).toFixed(2));

      const { error: dbError } = await supabase.from('jobs').insert([{
        short_id: shortId,
        client_name: formData.clientName,
        phone: formData.phone,
        file_name: file.name,
        file_size_mb: fileSizeMb,
        file_type: file.type,
        storage_path: storagePath,
        copies: formData.copies,
        color_mode: formData.colorMode,
        source: 'web',
        expires_at: expiresAt.toISOString(),
      }]);

      if (dbError) throw new Error('Database error: ' + dbError.message);

      addNotification('कागजात सफलतापूर्वक पेश गरियो!', 'success');
      onComplete({ id: shortId, status: 'pending' });

    } catch (error) {
      addNotification(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900">नयाँ कागजात अपलोड</h2>
        <p className="text-gray-500 text-sm">Upload Document - Mahuli Legal Service Center</p>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 text-center hover:bg-blue-50 transition-colors">
          <input 
            type="file" id="file-upload" className="hidden" 
            accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange}
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
            <Upload className="w-10 h-10 text-blue-500 mb-2" />
            <span className="text-blue-700 font-medium">यहाँ क्लिक गर्नुहोस् वा फाइल तान्नुहोस्</span>
            <span className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max {maxSizeMB}MB)</span>
            {file && (
              <div className="mt-4 p-2 bg-blue-100 text-blue-800 rounded-lg text-sm w-full font-medium flex items-center justify-center">
                <FileText className="w-4 h-4 mr-2" /> {file.name}
              </div>
            )}
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">पूरा नाम (Name)</label>
            <input required type="text" className="w-full p-2 border border-gray-300 rounded-lg"
              value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">फोन नम्बर (Phone)</label>
            <input required type="tel" pattern="[0-9]{10}" className="w-full p-2 border border-gray-300 rounded-lg"
              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">प्रतिलिपिहरू (Copies)</label>
            <select className="w-full p-2 border border-gray-300 rounded-lg"
              value={formData.copies} onChange={e => setFormData({...formData, copies: Number(e.target.value)})}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">रंग (Color Mode)</label>
            <select className="w-full p-2 border border-gray-300 rounded-lg"
              value={formData.colorMode} onChange={e => setFormData({...formData, colorMode: e.target.value})}>
              <option value="bw">Black & White</option>
              <option value="color">Color</option>
            </select>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 flex items-start mt-4">
          <Shield className="w-4 h-4 mr-1 flex-shrink-0" />
          <p>तपाईंको कागजात सुरक्षित छ (Private Storage)। यो सार्वजनिक रूपमा उपलब्ध हुँदैन।</p>
        </div>

        <button type="submit" disabled={isSubmitting || !isConfigured}
          className={`w-full py-3 px-4 rounded-lg text-white font-bold text-lg flex items-center justify-center ${
            isSubmitting || !isConfigured ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}>
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'अपलोड गर्नुहोस् (Submit)'}
        </button>
      </div>
    </form>
  );
};

const ClientSuccessView = ({ job, onReset }) => (
  <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-lg mx-auto text-center">
    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
    <h2 className="text-2xl font-bold text-gray-800 mb-2">सफलतापूर्वक पेश गरियो!</h2>
    
    <div className="bg-gray-50 p-6 rounded-xl mb-6 mt-4">
      <p className="text-sm text-gray-500 mb-2">तपाईंको ट्र्याकिङ आईडी</p>
      <p className="text-4xl font-black text-blue-900 tracking-widest mb-6">{job.id}</p>
      <VisualQRCode value={job.id} size={140} />
      <p className="text-xs text-gray-500 mt-4">कार्यालयमा पुगेर यो आईडी वा QR देखाउनुहोस्।</p>
    </div>
    
    <button onClick={onReset} className="text-blue-600 font-medium hover:underline">
      अर्को कागजात अपलोड गर्नुहोस्
    </button>
  </div>
);

const ClientTrackView = () => {
  const { supabase, isConfigured } = useContext(SystemContext);
  const [searchId, setSearchId] = useState('');
  const [jobData, setJobData] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!isConfigured) return;
    setStatusMsg('Searching...');
    
    const { data, error } = await supabase.rpc('track_job_status', { p_short_id: searchId.toUpperCase() });
    
    if (error || !data || data.length === 0) {
      setJobData(null);
      setStatusMsg('No record found. (कुनै रेकर्ड फेला परेन)');
    } else {
      setJobData(data[0]);
      setStatusMsg('');
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input type="text" placeholder="ट्र्याकिङ आईडी प्रविष्ट गर्नुहोस्" maxLength={6}
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 uppercase"
          value={searchId} onChange={e => setSearchId(e.target.value)} />
        <button type="submit" disabled={!isConfigured} className="bg-blue-900 text-white px-6 rounded-lg hover:bg-blue-800">
          <Search className="w-5 h-5" />
        </button>
      </form>

      {statusMsg && !jobData && (
        <div className="bg-gray-100 text-gray-700 p-4 rounded-lg text-center font-medium">{statusMsg}</div>
      )}

      {jobData && new Date() > new Date(jobData.expires_at) && (
        <div className="bg-orange-50 text-orange-700 p-6 rounded-2xl shadow-lg border border-orange-100 text-center">
           <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-orange-500" />
           <h3 className="text-lg font-bold">म्याद सकिएको छ (Expired)</h3>
           <p className="text-sm">सुरक्षाका कारण यो कागजात प्रणालीबाट मेटिने प्रक्रियामा छ।</p>
        </div>
      )}

      {jobData && new Date() <= new Date(jobData.expires_at) && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Job: {searchId.toUpperCase()}</h3>
            <StatusBadge status={jobData.status} />
          </div>
          <div className="bg-blue-50 p-4 rounded-lg flex items-start space-x-3 text-sm text-blue-800">
             <Shield className="w-5 h-5 flex-shrink-0" />
             <p>गोपनीयता सुरक्षित गर्न, व्यक्तिगत विवरण र कागजात यहाँ देखाइएको छैन। कृपया प्रिन्ट लिन अफिसमा जानुहोस्।</p>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminLogin = () => {
  const { loginAdmin } = useContext(SystemContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    await loginAdmin(email, password);
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl">
      <div className="text-center mb-6">
        <Lock className="w-12 h-12 text-blue-900 mx-auto mb-2" />
        <h2 className="text-2xl font-bold">Admin Portal Login</h2>
        <p className="text-xs text-gray-500 mt-2">Authorized office operator credentials required.</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <input required type="email" placeholder="Admin Email" 
          className="w-full p-3 border rounded-lg" value={email} onChange={e => setEmail(e.target.value)} />
        <input required type="password" placeholder="Password" 
          className="w-full p-3 border rounded-lg" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white p-3 rounded-lg font-bold">
          {loading ? 'Authenticating...' : 'Secure Login'}
        </button>
      </form>
    </div>
  );
};

const AdminDashboard = () => {
  const { supabase, addNotification, logoutAdmin } = useContext(SystemContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) addNotification('Failed to fetch jobs', 'error');
    else setJobs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', id);
    if (error) {
      addNotification('Update failed', 'error');
    } else {
      addNotification(`Status updated to ${newStatus}`, 'success');
      fetchJobs();
    }
  };

  const getSecureDownloadUrl = async (path) => {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 60);
      
    if (error) {
      addNotification('Could not access secure file', 'error');
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Office Print Queue Dashboard</h2>
          <p className="text-gray-500 text-sm">Mahuli Legal Service Center - Web-Only Mode</p>
        </div>
        <button onClick={logoutAdmin} className="flex items-center text-red-600 font-medium hover:bg-red-50 p-2 rounded">
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-600">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Client Details</th>
              <th className="p-4">Document</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <tr><td colSpan="5" className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500"/></td></tr> : 
             jobs.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-gray-500">No jobs found in Database.</td></tr> :
             jobs.map(job => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="p-4 font-mono font-medium text-blue-900">{job.short_id}</td>
                <td className="p-4">
                  <div className="font-medium">{job.client_name}</div>
                  <div className="text-xs text-gray-500">{job.phone}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center text-gray-700">
                    <FileText className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="truncate max-w-[150px]" title={job.file_name}>{job.file_name}</span>
                  </div>
                  <div className="text-xs text-gray-400">{job.file_size_mb} MB • {job.copies}x {job.color_mode.toUpperCase()}</div>
                  <button onClick={() => getSecureDownloadUrl(job.storage_path)} className="text-blue-600 text-xs flex items-center mt-1 hover:underline">
                    <Download className="w-3 h-3 mr-1"/> View Securely
                  </button>
                </td>
                <td className="p-4"><StatusBadge status={job.status} /></td>
                <td className="p-4 text-right space-x-2">
                  {job.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(job.id, 'approved')} className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">Approve</button>
                      <button onClick={() => updateStatus(job.id, 'rejected')} className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium">Reject</button>
                    </>
                  )}
                  {job.status === 'approved' && (
                     <button onClick={() => updateStatus(job.id, 'completed')} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">Mark Printed</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MainApp = () => {
  const { isAdmin } = useContext(SystemContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('client'); 
  const [clientView, setClientView] = useState('upload'); 
  const [currentJob, setCurrentJob] = useState(null);

  const handleJobSubmit = (job) => {
    setCurrentJob(job);
    setClientView('success');
  };

  const NavButton = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => { setActiveTab(id); setMobileMenuOpen(false); }}
      className={`flex items-center px-4 py-3 w-full text-left rounded-lg mb-2 transition-colors ${
        activeTab === id ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span className="flex-1 font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      <aside className={`fixed inset-y-0 left-0 bg-blue-900 text-white w-64 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 z-40 shadow-2xl md:shadow-none`}>
        <div className="p-6">
          <h1 className="text-xl font-black leading-tight mb-2">महुली कानुनी परामर्श</h1>
          <p className="text-blue-300 text-xs font-medium uppercase tracking-wider mb-8">Print System (Web Mode)</p>
          <nav>
            <div className="text-xs text-blue-400 font-bold mb-3 mt-4 uppercase tracking-wider">Client Portal</div>
            <NavButton id="client" icon={Smartphone} label="Public Portal" />
            <div className="text-xs text-blue-400 font-bold mb-3 mt-8 uppercase tracking-wider">Office Backend</div>
            <NavButton id="admin" icon={Shield} label="Admin Dashboard" />
          </nav>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between md:hidden sticky top-0 z-30">
          <div className="font-bold text-blue-900">Mahuli Print System</div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600 bg-gray-100 rounded-md">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        <div className="p-4 md:p-8 flex-1 relative">
          {activeTab === 'client' && (
            <div className="animate-in fade-in">
              <div className="flex justify-center mb-8 bg-gray-200 p-1 rounded-xl max-w-sm mx-auto">
                <button onClick={() => setClientView('upload')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${['upload','success'].includes(clientView) ? 'bg-white shadow-sm text-blue-900' : 'text-gray-600'}`}>Upload</button>
                <button onClick={() => setClientView('track')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${clientView === 'track' ? 'bg-white shadow-sm text-blue-900' : 'text-gray-600'}`}>Track Status</button>
              </div>
              {clientView === 'upload' && <ClientUploadForm onComplete={handleJobSubmit} />}
              {clientView === 'success' && <ClientSuccessView job={currentJob} onReset={() => setClientView('upload')} />}
              {clientView === 'track' && <ClientTrackView />}
            </div>
          )}

          {activeTab === 'admin' && (
            isAdmin ? <AdminDashboard /> : <AdminLogin />
          )}
        </div>
      </main>
      
      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <SystemProvider>
      <MainApp />
    </SystemProvider>
  )
