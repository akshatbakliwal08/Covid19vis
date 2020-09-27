const sgMail=require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail=(email, name)=>{
    sgMail.send({
        to:email,
        from:'akshatbakliwal08@gmail.com',
        subject:'Welcome',
        text: 'Welcome to the app, '+name+'. Let me know how you get along'
    });
}

module.exports={
    sendWelcomeEmail
}