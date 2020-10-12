const express=require('express');
// require('../db/mongoose');
// const User=require('../models/user');
// const { update } = require('../models/user');
// const userRouter=require('../router/user');
const bodyParser=require('body-parser');
const app=express();
const hbs=require('hbs');
const path=require('path');
const port=process.env.PORT;
const viewsPath=path.join(__dirname,'../covid-19-website-master');
app.set('view engine','hbs');
app.set('views',viewsPath);
const partialpath=path.join(__dirname,'../covid-19-website-master/partials');
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'../covid-19-website-master')));
app.use(bodyParser.urlencoded({ 
    extended: true
}));
console.log(path.join(__dirname,'./covid-19-website-master'));
hbs.registerPartials(partialpath);
// const auth=require('../middleware/auth');
// const { sendWelcomeEmail }=require('../email/account');
const mongoose=require('mongoose');


// const mongoose=require('mongoose');
const validator=require('validator');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');

const auth=async(req,res,next)=>{
    try{
        // const token=req.header('Authorization').replace('Bearer ','');
        const token=req.user.tokens[3].token;
        console.log(token);
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        const user=await User.findOne({_id:decoded._id,'tokens.token':token});
        if(!user)
            throw new Error();
        req.token=token;
        req.user=user;
        next();
    } catch(e){
        res.status(401).send({error:'Please Authenticate'});
    }
}

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


app.use(express.json());
// app.use(userRouter);
app.use(express.static('covid-19-website-master'));

app.listen(port,()=>{
    mongoose.connect('mongodb://127.0.0.1:27017/COVID',{
        useNewUrlParser:true,
        useCreateIndex:true,
        // useFindAndModify:false,
        useUnifiedTopology:true
    });
    console.log('Server is up on port '+port);
});
const db=mongoose.connection;
db.on('error', console.log.bind(console, "connection error")); 
db.once('open', function(callback){ 
    console.log("connection succeeded"); 
});
app.get('',(req,res)=>{
    res.render('main',{
        title:'mainPage',
        name:'Bakli'
    });
});

app.get('/help',(req,res)=>{
    res.render('helpdesk',{
        title:'Help Desk',
        name:'Bakli'
    });
});
app.patch('/help',auth,async(req,res)=>{
    const updates=Object.keys(req.body);
    const allowUpdates=['symptom'];
    const isValidOp=updates.every((update)=>allowUpdates.includes(update));
    if(!isValidOp){
        return res.status(400).send({error:'Invalid update!!'});
    }
    try{
        updates.forEach((update)=>req.user[update]=req.body[update]);
        await req.user.save();
        res.render('home');
    } catch(e){
        res.status(400).send(e);
    }
});

app.get('/map',(req,res)=>{
    res.render('index',{
        title:'COVID Map',
        name:'Bakli'
    });
});

app.get('/home',(req,res)=>{
    res.render('home',{
        title:'Home Page',
        name:'bakli'
    });
});
app.post('/home',auth,async(req,res)=>{
    try{
        req.user.tokens=[];
        await req.user.save();
        res.render('main');
    } catch(e){
        res.status(500).send();
    }
});


app.get('/login',(req,res)=>{
    res.render('signup',{
        title:'Login Page',
        name:'bakli'
    });
});
app.post('/login',async(req,res)=>{
    try{
        const email=req.body.email;
        password=req.body.password;
        const user=await User.findByCredentials(email,password);
        await user.generateAuthToken();
        user.save();
        res.render('home');
    } catch(e){
        res.status(400).send(e);
    }
});

app.get('/signup',(req,res)=>{
    res.render('login',{
        title:'SignUp Page',
        name:'bakli'
    });
});
app.post('/signup',async(req,res)=>{
    // const name=req.body.name;
    // const email=req.body.email;
    // const age=req.body.age;
    // const password=req.body.password;
    // const user=new User({name,email,age,password});
    const user=new User(req.body);
    try{
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        await user.generateAuthToken();
        await user.save();
        res.status(201).render('signup');
    } catch(e){
        res.status(400).send();
    }
});



const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        trim:true,
        lowercase:true,
        unique:true,
        validate(value) {
            if(!validator.isEmail(value))
                throw new Error('Email is invalid');
        }
    },
    password:{
        type:String,
        required:true,
        trim:true,
        minlength:7,
        validate(value) {
            if(value.toLowerCase().includes('password'))
                throw new Error('Password should not contain Password');
        }
    },
    age:{
        type:Number
    },
    symptom:{
        type:String,
        default:'No Symptom'
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
});
userSchema.methods.toJSON=function(){
    const user=this;
    const userObject=user.toObject();
    delete userObject.password;
    delete userObject.tokens;
    return userObject;
}
userSchema.methods.generateAuthToken=async function(){
    const user=this;
    const token=jwt.sign({_id:user._id.toString()},process.env.JWT_SECRET);
    //console.log(token);
    user.tokens=user.tokens.concat({token});
    await user.save();
    return token;
}
userSchema.statics.findByCredentials= async(email,password)=>{
    const user=await User.findOne({email});
    if(!user)
        throw new Error('Unable to login');
    const isMatch=await bcrypt.compare(password,user.password);
    if(!isMatch)
        throw new Error('Unable to login');
    return user;
}
userSchema.pre('save',async function (next){
    const user=this;
    if(user.isModified('password')){
        user.password=await bcrypt.hash(user.password,8);
    }
    next();
});
const User=mongoose.model('User',userSchema);