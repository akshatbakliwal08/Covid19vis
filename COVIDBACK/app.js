const express=require('express');
const app=express();
const hbs=require('hbs');
const path=require('path');
const port=process.env.PORT||3000;
const viewsPath=path.join(__dirname,'../covid-19-website-master');
app.set('view engine','hbs');
app.set('views',viewsPath);
const partialpath=path.join(__dirname,'../covid-19-website-master/partials');
app.use(express.static(path.join(__dirname,'../covid-19-website-master')));
console.log(path.join(__dirname,'./covid-19-website-master'));
hbs.registerPartials(partialpath);
app.get('/map',(req,res)=>{
    res.render('index',{
        title:'COVID',
        name:'Bakli'
    });
});
app.get('',(req,res)=>{
    res.render('home',{
        title:'home',
        name:'bakli'
    });
});
app.get('/login',(req,res)=>{
    res.render('signup',{
        title:'signup',
        name:'bakli'
    });
});
app.get('/signup',(req,res)=>{
    res.render('login',{
        title:'login',
        name:'bakli'
    });
});

app.listen(port,()=>{
    console.log('Server is up on port '+port);
});