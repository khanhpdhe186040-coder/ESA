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
exports.sendGuestRegistrationEmail = async (user, course, password) => {
    const subject = "Congratulations on your course registration!";
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Congratulations on successfully registering for the course: ${course.name}</h2>
            <p><strong>Price:</strong> ${new Intl.NumberFormat('vi-VN').format(course.price)} VND</p>
            <hr>
            <p>This is the account provided for you:</p>
            <p><strong>Username:</strong> ${user.userName}</p>
            
            <p><strong>Password:</strong> ${password}</p>
            
            <p>(You can change your password in your profile after logging in)</p>
            <br>
            <p>Thank you!</p>
        </div>
    `;
    
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
exports.sendTeacherEnrollmentNotification = async (teacher, student, classInfo) => {
    const subject = `New Enrollment Request for ${classInfo.name}`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Hi ${teacher.fullName},</h2>
            <p>A student has requested to enroll in your class:</p>
            <p><strong>Class:</strong> ${classInfo.name}</p>
            <p><strong>Student:</strong> ${student.fullName} (${student.email})</p>
            <br>
            <p>Please log in to your Teacher Panel to approve or reject this request.</p>
        </div>
    `;
    sendEmail(teacher.email, subject, html);
};

// 6. MẪU EMAIL MỚI: Gửi cho SV khi được DUYỆT
exports.sendStudentApprovalEmail = async (student, classInfo) => {
    const subject = `Enrollment Approved: ${classInfo.name}`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Congratulations ${student.fullName},</h2>
            <p>Your request to enroll in the following class has been <strong>APPROVED</strong>:</p>
            <h3>${classInfo.name}</h3>
            <p>You can now see this class in your "My Classes" list and join the lessons.</p>
        </div>
    `;
    sendEmail(student.email, subject, html);
};

// 7. MẪU EMAIL MỚI: Gửi cho SV khi bị TỪ CHỐI
exports.sendStudentRejectionEmail = async (student, classInfo) => {
    const subject = `Enrollment Update: ${classInfo.name}`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Hi ${student.fullName},</h2>
            <p>We regret to inform you that your request to enroll in the following class has been <strong>REJECTED</strong>:</p>
            <h3>${classInfo.name}</h3>
            <p>This may be due to class capacity or other factors. If you believe this is a mistake, you may try to enroll again or contact support.</p>
        </div>
    `;
    sendEmail(student.email, subject, html);
};