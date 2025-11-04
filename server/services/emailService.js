const nodemailer = require('nodemailer');

// 1. Cấu hình "Transport" (Phương tiện gửi)
// Chúng ta sẽ dùng Gmail làm ví dụ.
// BẠN PHẢI SỬ DỤNG "App Password" (Mật khẩu ứng dụng) của Google nếu dùng Gmail.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Sẽ lấy từ tệp .env
        pass: process.env.EMAIL_PASS, // Sẽ lấy từ tệp .env
    },
});

// 2. Hàm gửi email chung
const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"ESA" <${process.env.EMAIL_USER}>`, // Tên người gửi
            to: to, // Email người nhận
            subject: subject, // Tiêu đề
            html: html, // Nội dung HTML
        });
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
    }
};

// 3. Mẫu email cho GUEST (Đăng ký mới)
exports.sendGuestRegistrationEmail = async (user, course) => {
    const subject = "Congratulations on your course registration!";
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Congratulations on successfully registering for the course: ${course.name}</h2>
            <p><strong>Price:</strong> ${new Intl.NumberFormat('vi-VN').format(course.price)} VND</p>
            <hr>
            <p>This is the account provided for you:</p>
            <p><strong>Username:</strong> ${user.userName}</p>
            <p><strong>Password:</strong> 123</p>
            <p>(You can change your password in your profile after logging in)</p>
            <br>
            <p>Thank you!</p>
        </div>
    `;
    
    // Gửi email (Không cần await để tránh làm chậm phản hồi API)
    sendEmail(user.email, subject, html);
};

// 4. Mẫu email cho STUDENT (Đã có tài khoản)
exports.sendStudentEnrollmentEmail = async (user, course) => {
    const subject = "Congratulations on your new course enrollment!";
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Congratulations ${user.fullName},</h2>
            <p>You have successfully registered for a new course:</p>
            <h3>${course.name}</h3>
            <p><strong>Price:</strong> ${new Intl.NumberFormat('vi-VN').format(course.price)} VND</p>
            <br>
            <p>You can start learning now by visiting your "My Classes" page.</p>
            <p>Thank you!</p>
        </div>
    `;
    
    // Gửi email
    sendEmail(user.email, subject, html);
};
exports.sendEmail = sendEmail;