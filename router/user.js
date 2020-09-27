const express=require('express');
const router=new express.Router();
const User=require('../models/user');
const auth=require('../middleware/auth');
const { sendWelcomeEmail }=require('../email/account');

router.post('/users/signup',async(req,res)=>{
    const user=new User(req.body);

    try{
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token=await user.generateAuthToken();
        res.status(201).send({user,token});
    } catch(e){
        res.status(400).send(e);
    }
});

router.post('/users/login',async(req,res)=>{
    try{
        const user=await User.findByCredentials(req.body.email,req.body.password);
        const token=await user.generateAuthToken();
        res.send({user,token});
    } catch(e){
        res.status(400).send();
    }
});

router.post('/users/logout',auth,async(req,res)=>{
    try{
        req.user.tokens=req.user.tokens.filter((token)=>{
            return token.token!==req.token;
        });
        await req.user.save();
        res.send();
    } catch(e){
        res.status(500).send();
    }
});

router.get('/users/me',auth,async(req,res)=>{
    res.send(req.user);
});

router.patch('/help',auth,async(req,res)=>{
    const updates=Object.keys(req.body);
    const allowUpdates=['symptom'];
    const isValidOp=updates.every((update)=>allowUpdates.includes(update));
    if(!isValidOp){
        return res.status(400).send({error:'Invalid update!!'});
    }
    try{
        updates.forEach((update)=>req.user[update]=req.body[update]);
        await req.user.save();
        res.send(req.user);
    } catch(e){
        res.status(400).send(e);
    }
});

router.delete('/users/me',auth,async(req,res)=>{
    try{
        await req.user.remove();
        res.send(req.user);
    } catch(e){
        res.status(500).send(e);
    }
});

module.exports=router;