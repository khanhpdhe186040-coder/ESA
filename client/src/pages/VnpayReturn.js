import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function VnpayReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Đang xử lý kết quả thanh toán...');

  useEffect(() => {
    const finalize = async () => {
      try {
        const respCode = searchParams.get('vnp_ResponseCode');
        const txnRef = searchParams.get('vnp_TxnRef');
        let courseId = localStorage.getItem('pendingCourseId');
        const formDataRaw = localStorage.getItem('pendingCourseForm');
        const formData = formDataRaw ? JSON.parse(formDataRaw) : null;
        if (!courseId && txnRef && txnRef.includes('-')) {
          courseId = txnRef.split('-')[0];
          localStorage.setItem('pendingCourseId', courseId);
        }
        if (respCode !== '00') {
          setStatus('error');
          setMessage('Thanh toán thất bại hoặc bị hủy.');
          setTimeout(() => navigate(`/course-register/${courseId || ''}?paid=fail`), 1200);
          return;
        }
        if (!courseId || !formData) {
          setStatus('error');
          setMessage('Thiếu dữ liệu đăng ký. Vui lòng đăng ký lại.');
          setTimeout(() => navigate(`/course-register/${courseId || ''}?paid=missing`), 1200);
          return;
        }
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9999/api'}/users/register-for-course`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, courseId })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          localStorage.removeItem('pendingCourseForm');
          localStorage.removeItem('pendingCourseId');
          setStatus('success');
          setMessage('Thanh toán thành công. Đăng ký khóa học đã được tạo ở trạng thái pending.');
          setTimeout(() => navigate(`/course-register/${courseId}?paid=success`), 1000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Không thể hoàn tất đăng ký sau thanh toán.');
          setTimeout(() => navigate(`/course-register/${courseId}?paid=error`), 1200);
        }
      } catch {
        setStatus('error');
        setMessage('Có lỗi xảy ra khi hoàn tất đăng ký.');
        setTimeout(() => navigate(`/course-register/`), 1200);
      }
    };
    finalize();
  }, [searchParams]);

  return null;
}
