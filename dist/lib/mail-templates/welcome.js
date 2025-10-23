/**
 * Welcome email template
 */
export const welcomeTemplate = (name, frontendUrl = 'http://localhost:3000') => ({
    subject: '🎉 Welcome to GymPal - Your Fitness Journey Starts Here!',
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to GymPal</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .welcome-message { font-size: 18px; margin-bottom: 30px; color: #2c3e50; }
        .features { margin: 30px 0; }
        .feature { display: flex; align-items: center; margin: 15px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea; }
        .feature-icon { font-size: 24px; margin-right: 15px; }
        .feature-text { flex: 1; }
        .feature-title { font-weight: 600; color: #2c3e50; margin-bottom: 5px; }
        .feature-desc { color: #6c757d; font-size: 14px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: transform 0.2s; }
        .cta-button:hover { transform: translateY(-2px); }
        .next-steps { background-color: #e8f4fd; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #2196f3; }
        .next-steps h3 { margin: 0 0 15px 0; color: #1976d2; }
        .next-steps ol { margin: 0; padding-left: 20px; }
        .next-steps li { margin: 8px 0; color: #424242; }
        .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
        .footer p { margin: 5px 0; color: #6c757d; font-size: 14px; }
        .social-links { margin: 20px 0; }
        .social-links a { color: #667eea; text-decoration: none; margin: 0 10px; font-weight: 500; }
        .highlight { background-color: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .highlight p { margin: 0; color: #856404; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to GymPal!</h1>
          <p>Your fitness journey starts now, ${name}!</p>
        </div>
        
        <div class="content">
          <div class="welcome-message">
            <p>We're thrilled to have you join our fitness community! You've just taken the first step towards achieving your health and fitness goals.</p>
          </div>

          <div class="highlight">
            <p>💡 <strong>Pro Tip:</strong> Complete your profile setup to get personalized workout recommendations and track your progress more effectively!</p>
          </div>

          <div class="features">
            <h3 style="color: #2c3e50; margin-bottom: 20px;">What you can do with GymPal:</h3>
            
            <div class="feature">
              <div class="feature-icon">🏋️‍♂️</div>
              <div class="feature-text">
                <div class="feature-title">Custom Workout Plans</div>
                <div class="feature-desc">Access personalized workout routines tailored to your fitness level and goals</div>
              </div>
            </div>

            <div class="feature">
              <div class="feature-icon">📊</div>
              <div class="feature-text">
                <div class="feature-title">Progress Tracking</div>
                <div class="feature-desc">Monitor your fitness journey with detailed analytics and progress reports</div>
              </div>
            </div>

            <div class="feature">
              <div class="feature-icon">👥</div>
              <div class="feature-text">
                <div class="feature-title">Community Support</div>
                <div class="feature-desc">Connect with like-minded fitness enthusiasts and share your achievements</div>
              </div>
            </div>

            <div class="feature">
              <div class="feature-icon">🤖</div>
              <div class="feature-text">
                <div class="feature-title">AI-Powered Insights</div>
                <div class="feature-desc">Get smart recommendations and form analysis powered by artificial intelligence</div>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/dashboard" class="cta-button">Start Your Fitness Journey →</a>
          </div>

          <div class="next-steps">
            <h3>🚀 Quick Start Guide</h3>
            <ol>
              <li><strong>Complete your profile</strong> - Add your fitness level, goals, and preferences</li>
              <li><strong>Set up your workout space</strong> - Tell us what equipment you have available</li>
              <li><strong>Choose your first workout</strong> - Browse our library of beginner-friendly routines</li>
              <li><strong>Track your progress</strong> - Log your workouts and see your improvement over time</li>
              <li><strong>Join the community</strong> - Connect with other users and share your achievements</li>
            </ol>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h4 style="color: #2c3e50; margin: 0 0 10px 0;">📱 Download Our Mobile App</h4>
            <p style="margin: 0; color: #6c757d;">Get the full GymPal experience on your mobile device. Available on iOS and Android.</p>
          </div>
        </div>

        <div class="footer">
          <div class="social-links">
            <a href="${frontendUrl}/community">Community</a>
            <a href="${frontendUrl}/help">Help Center</a>
            <a href="${frontendUrl}/contact">Contact Us</a>
          </div>
          <p>Thank you for choosing GymPal!</p>
          <p>The GymPal Team</p>
          <p style="font-size: 12px; color: #adb5bd;">
            You received this email because you signed up for GymPal. 
            <a href="${frontendUrl}/unsubscribe" style="color: #667eea;">Unsubscribe</a> | 
            <a href="${frontendUrl}/privacy" style="color: #667eea;">Privacy Policy</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
    text: `
🎉 Welcome to GymPal, ${name}!

Your fitness journey starts now! We're thrilled to have you join our fitness community.

WHAT YOU CAN DO WITH GYMPAL:
• 🏋️‍♂️ Custom Workout Plans - Personalized routines for your fitness level
• 📊 Progress Tracking - Monitor your fitness journey with detailed analytics
• 👥 Community Support - Connect with like-minded fitness enthusiasts
• 🤖 AI-Powered Insights - Smart recommendations and form analysis

QUICK START GUIDE:
1. Complete your profile - Add your fitness level, goals, and preferences
2. Set up your workout space - Tell us what equipment you have available
3. Choose your first workout - Browse our library of beginner-friendly routines
4. Track your progress - Log your workouts and see your improvement over time
5. Join the community - Connect with other users and share your achievements

Get started: ${frontendUrl}/dashboard

Need help? Visit our Help Center: ${frontendUrl}/help

Thank you for choosing GymPal!
The GymPal Team

---
You received this email because you signed up for GymPal.
Unsubscribe: ${frontendUrl}/unsubscribe | Privacy Policy: ${frontendUrl}/privacy
  `
});
