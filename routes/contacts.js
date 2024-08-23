const express = require('express');
const Router = express.Router();
const pool = require('../util/database').pool;
const validator = require('validator'); // Import the validator library
const verifyToken = require("../Controllers/auth/verifyToken")
Router.post('/contacts',verifyToken, async(req, res)=>{
    const [name, address, phone, country, region, city, zipcode] = req.body
    try {
        if (!validator.isLength(name, { min: 1, max: 255 })){
            res.status(400).json({
                status: false, 
                message: 'name required'
            });
        }

        if(!validator.isLength(address)){
            res. status(400).json({
                status: false, 
                message: 'address required'})
        }

        if(!validator.isNumeric(phone)){
            res. status(400).json({
                status: false, 
                message: 'phone must be a number or an integer and must contain at least 10 characters'})
        }
        if(!validator.isLength(country)){
            res. status(400).json({
                status: false, 
                message: 'country required'})
        }
        if(!validator.isLength(region)){
            res. status(400).json({
                status: false, 
                message: 'region required'})
        }
        if(!validator.isLength(city)){
            res. status(400).json({
                status: false, 
                message: 'city required'})
        }

        const nigeriaPostalCodePattern = /^[0-9]{6}$/;
        const userPostalCode = '123456'
        if(nigeriaPostalCodePattern.test(userPostalCode)){
            res. status(400).json({
                status: true, 
                message: 'Valid Nigerian postal code'})
        }else{
            res. status(400).json({
                status: false, 
                message: 'Invalid postal code'})
        }

         await pool.query('Insert into contact (name, address, phone, country, region, city, zipcode) values (?,?,?,?,?,?,?)',[name, address, phone, country, region, city, userPostalCode])
        
         res.status(201).json({
            status: true, 
            message: 'contact inserted successfully'
        });
    } catch (error) {
       res. status({
        status: false,
        error: error.message}) 
    }
})

Router.get('/contacts',verifyToken, async(req, res)=>{
    try {

     const [result] = await pool.query('SELECT * FROM contact')
     if(!result || result.length === 0){
        res. status(400).json({
            status: false, 
            message:'Contact not found'})
     }else{
        res.status(200).json({
            status: true, 
            contacts: result // You should return the contacts here
        });
     }
        
    } catch (error) {
        console. log(error)
        res. status(500).json({
            status: false, 
            error: error.message})
    }
})

Router.get('/contacts/:id',verifyToken, async(req, res)=>{
    const contactId = req.params.id
    try {

     const [result] = await pool.query('SELECT * FROM contact where id =?',[contactId])
     if(!result || result.length === 0){
        res. status(400).json({
            status: false, 
            message:'Contact not found'})
     }
        
    } catch (error) {
        console. log(error)
        res. status(500).json({
            status: true, 
            error: error.message})
    }
})

Router.patch('/contact/:id',verifyToken, async(req, res)=>{
    const contactId = req.params.id
    const [name, address, phone, country, region, city, zipcode] = req.body
    try {
        const [contact] = await pool. query('SELECT * FROM contact WHERE id = ?',[contactId])
        if(contact.length === 0){
            return res.status(400).json({message:'contact not found'})
        }

    const [result] = await pool. query('update contact SET (name, address, phone, country, region, city, zipcode)values(?,?,?,?,?,?,?)',[name, address, phone, country, region, city, zipcode])

    if(!result){
        res.status(400).json({message: 'contact not updated successfully'})
    }else{
        res.status(200).json({message: 'contact updated successfully'})
    }

       
    } catch (error) {
        console.log(error)
        res.status(500).json({message: error.message})
    }
})

Router. put('',(req, res)=>{
    
})


Router.delete('/contact',verifyToken, async(req, res)=>{
   try {
    const result = await pool.query('delete from contact')

     
    if(!result){
        res.status(400).json({message: 'contact not deleted successfully'})
    }else{
        res.status(200).json({message: 'contact deleted successfully'})
    }
   } catch (error) {
    console.log(error)
    res.status(500).json({message: error.message})
   } 
})

Router.delete('/contact/:id',verifyToken, async(req, res)=>{
    const contactId = req.params.id
    try {
     const result = await pool.query('delete from contact where id =?',[contactId])
    
     if(!result){
        res.status(400).json({message: 'contact not deleted successfully'})
    }else{
        res.status(200).json({message: 'contact deleted successfully'})
    }

    } catch (error) {
        console.log(error)
        res.status(500).json({message: error.message})
    }
   
 })