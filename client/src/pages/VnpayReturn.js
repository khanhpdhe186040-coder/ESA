import { useEffect, useState, useRef } from "react"; 
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader } from "lucide-react"; 

export default function VnpayReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // DỊCH: 'Đang xử lý kết quả thanh toán...' -> 'Processing payment results...'
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing payment results...');
  const [isStudent, setIsStudent] = useState(false); 
  
  const hasFinalized = useRef(false);

  useEffect(() => {
    const finalize = async () => {
      
      if (hasFinalized.current) {
        return; 
      }
      hasFinalized.current = true; 

      try {
        const respCode = searchParams.get('vnp_ResponseCode');
        const txnRef = searchParams.get('vnp_TxnRef');

        const pendingUserId = localStorage.getItem('pendingUserId');
        const formDataRaw = localStorage.getItem('pendingCourseForm');
        let courseId = localStorage.getItem('pendingCourseId');

        if (!courseId && txnRef && txnRef.includes('-')) {
          courseId = txnRef.split('-')[0];
          localStorage.setItem('pendingCourseId', courseId);
        }

        // 1. Xử lý thanh toán thất bại
        if (respCode !== '00') {
          setStatus('error');
          
          setMessage('Payment failed or was canceled.');
          return;
        }

        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:9999/api';

        // 2. Xử lý logic cho SINH VIÊN ĐÃ ĐĂNG NHẬP
        if (pendingUserId) {
          setIsStudent(true); 

          if (!courseId) {
             setStatus('error');
           
             setMessage('Missing course ID. Please contact support.');
             return;
          }
          
          const res = await fetch(`${apiUrl}/users/enroll-existing-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: pendingUserId, courseId })
          });
          const data = await res.json();

          if (res.ok && data.success) {
            localStorage.removeItem('pendingUserId');
            localStorage.removeItem('pendingCourseId');
            setStatus('success');
            
            setMessage('Payment successful. Information has been sent to your email (if available).');
          } else {
            setStatus('error');
            
            setMessage(data.message || 'Unable to enroll after payment (Backend Error).');
          }

        } 
        // 3. Xử lý logic cho KHÁCH (Logic cũ)
        else if (formDataRaw) {
          setIsStudent(false); 
          const formData = JSON.parse(formDataRaw);
          if (!courseId || !formData) {
            setStatus('error');
            
            setMessage('Missing registration data. Please register again.');
            return;
          }

          const res = await fetch(`${apiUrl}/users/register-for-course`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, courseId })
          });
          const data = await res.json();

          if (res.ok && data.success) {
            localStorage.removeItem('pendingCourseForm');
            localStorage.removeItem('pendingCourseId');
            setStatus('success');
           
            setMessage('Payment successful. Your account information will be sent to your email.');
          } else {
            setStatus('error');
            
            setMessage(data.message || 'Could not complete registration after payment.');
          }
        } 
        // 4. Xử lý trường hợp thiếu dữ liệu
        else {
          setStatus('error');
          
          setMessage('Registration data not found after payment. Session may have expired.');
        }
        
      } catch (err) {
        setStatus('error');
      
        setMessage('An error occurred while finalizing registration: ' + err.message);
      }
    };
    
    finalize();
    
  }, [searchParams]); 

  
  const renderContent = () => {
    if (status === 'processing') {
      return (
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
       
          <h1 className="text-2xl font-semibold mt-4">Processing</h1>
          <p className="text-gray-600">{message}</p>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          
          <h1 className="text-3xl font-bold mt-4">Payment Successful!</h1>
          <p className="text-gray-700 mt-2 mb-6">{message}</p>
          <Link
            to={isStudent ? "/student/home" : "/"} 
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            {/* DỊCH: 'Về trang chủ' -> 'Back to Home' */}
            Back to Home
          </Link>
          {isStudent && (
             <Link
              to="/student/my-classes" 
              className="ml-4 px-6 py-3 bg-gray-100 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition-colors"
            >
            
              View My Classes
            </Link>
          )}
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
         
          <h1 className="text-3xl font-bold mt-4">Payment Failed</h1>
          <p className="text-gray-700 mt-2 mb-6">{message}</p>
          <Link
            to={isStudent ? "/student/home" : "/"} 
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
           
            Back to Home
          </Link>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-xl max-w-md w-full">
        {renderContent()}
      </div>
    </div>
  );
}