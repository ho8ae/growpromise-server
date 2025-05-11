import nodemailer from 'nodemailer';
import { ApiError } from '../middleware/error.middleware';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

/**
 * 이메일 전송 유틸리티 함수
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // 노드메일러 트랜스포터 생성
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.EMAIL_PORT || '2525'),
    auth: {
      user: process.env.EMAIL_USERNAME || 'your-mailtrap-username',
      pass: process.env.EMAIL_PASSWORD || 'your-mailtrap-password'
    }
  });

  // 이메일 옵션 설정
  const mailOptions = {
    from: process.env.EMAIL_FROM || '쑥쑥약속 <noreply@growpromise.com>',
    to: options.email,
    subject: options.subject,
    html: options.message
  };

  try {
    // 이메일 전송
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('이메일 전송 오류:', error);
    throw new ApiError('이메일 전송에 실패했습니다.', 500);
  }
};

/**
 * 비밀번호 재설정 이메일 템플릿 생성
 */
export const createPasswordResetTemplate = (username: string, resetUrl: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${process.env.LOGO_URL || 'https://growpromise.com/logo.png'}" alt="쑥쑥약속 로고" style="width: 100px;">
      </div>
      <h2 style="color: #4CAF50; text-align: center;">비밀번호 재설정</h2>
      <p>안녕하세요, ${username}님!</p>
      <p>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정하세요.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">비밀번호 재설정</a>
      </div>
      <p>이 링크는 10분 동안만 유효합니다.</p>
      <p>비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시해 주세요.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
        <p>쑥쑥약속 팀 드림</p>
      </div>
    </div>
  `;
};

/**
 * 아이디 찾기 이메일 템플릿 생성
 */
export const createFindUsernameTemplate = (username: string, userType: string): string => {
  const userTypeText = userType === 'PARENT' ? '부모' : '자녀';
  
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${process.env.LOGO_URL || 'https://growpromise.com/logo.png'}" alt="쑥쑥약속 로고" style="width: 100px;">
      </div>
      <h2 style="color: #4CAF50; text-align: center;">아이디 안내</h2>
      <p>안녕하세요, 쑥쑥약속입니다!</p>
      <p>요청하신 아이디 정보를 안내해 드립니다.</p>
      <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 16px;">
          <strong>회원 유형:</strong> ${userTypeText} 계정
        </p>
        <p style="margin: 8px 0 0; font-size: 18px; font-weight: bold; color: #4CAF50;">
          ${username}
        </p>
      </div>
      <p>로그인 페이지로 이동하여 위 아이디로 로그인해주세요.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">로그인 페이지로 이동</a>
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
        <p>쑥쑥약속 팀 드림</p>
      </div>
    </div>
  `;
};