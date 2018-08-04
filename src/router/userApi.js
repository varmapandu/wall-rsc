const express = require("express");
const blocktrail = require("blocktrail-sdk");
var CryptoJS = require( 'crypto-js' );
const router = express.Router();
const bcrypt = require("bcryptjs");
const session = require("express-session");
const userSchema = require("../models/userSchema");
const app = express();
const key = "a19a17d1e7ee9fda6266a3fa513f4dd2b5234c75";
const secret = "dfadf0448f0cd33f4b9cad4e847842e7452c41ca";
var client;
var toadd;

var secretKey = 'maheshisawesome';

var encryptedMessage;
var bytes;

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))
  
class User{
    constructor(){
        this.router = router;
        //this.client = client;
        this.postRoutes();
    }

    postRoutes(){
        this.router.post('/create',(req,res)=>{
          var hash = CryptoJS.AES.encrypt(req.body.walletpassword,secretKey);
          var creation = {
            walletid : req.body.walletid,
            walletpassword:req.body.walletpassword
          }

            client = blocktrail.BlocktrailSDK({apiKey:key,apiSecret:secret,network:"BTC",testnet:true});
            client.createNewWallet(req.body.walletid,req.body.walletpassword,(err, wallet, backupInfo)=>{
               console.log(wallet);
              console.log(creation);
              var wallet1 = {
                walletid : req.body.walletid,
                walletpassword:req.body.walletpassword
              }
              userSchema.findOne({email:req.body.email},(err,result)=>{
                console.log(result);
                console.log(result.wallet);
                
                if(err){
                  console.log("Error in set on insert",err);
                }else{
                  var wal = result.wallet;
                  var d = wal.push(wallet1);
                  result.wallet = d;

                 var sData = new userSchema(result);
                  sData.save((err,result)=>{
                    if(err){
                    console.log("Error in retriving",err);
                    res.send({status:"0",message:"Error message"})
                  }
                  else{
                    console.log(result);
                    //console.log(result.length);
                    res.send({status:"1",message:"send the data related to tabs",data:result});
                  }
                  
                })
            }
          })
          })
        })

        this.router.post('/send',(req,res)=>{
            client = blocktrail.BlocktrailSDK({apiKey: key, apiSecret: secret, network: "BTC", testnet: true});
              userSchema.findOne({walletid:req.body.walletid},(error,wallet)=>{
                if(error){
                  console.log({status:"error",message:"Error in getting wallet details"})
                }else{
                 
            
                var password = CryptoJS.AES.decrypt(wallet.walletpassword,secretKey).toString(CryptoJS.enc.Utf8);

                  var sending = client.initWallet(wallet.walletid,password,(err,wallet)=>{
                    if(err){
                      console.log("Error while decrypting wallet",err);
                    }else{
                      console.log("----------");
                      toadd = req.body.address;
                      console.log(toadd+" is the addr");
                      var pay = {};
                      pay[toadd] = blocktrail.toSatoshi(req.body.sentamount);
                        wallet.pay(pay,(err, result)=>{
                          if(err){
                            console.log("Error " +err);
                            res.send({status:"error",message:"Making the transaction resulted in error"})
                          }else{
                            console.log("result is "+result);
                            res.send({status:"success",message:"Making the transaction resulted in success and redirect to dashboard",data:result})
                          }
                        })
                    }
                  })
                }
              })
            })

          this.router.post('/rece',(req,res)=>{
            userSchema.findOne({walletid:req.body.walletid},(error,wallet)=>{
              console.log("Wallet details are ",wallet);
              if(error){
                console.log("Error in getting wallet details ",error);
              }else{
                client = blocktrail.BlocktrailSDK({apiKey: key, apiSecret: secret, network: "BTC", testnet: true});
                var password = CryptoJS.AES.decrypt(wallet.walletpassword,secretKey).toString(CryptoJS.enc.Utf8);
            client.initWallet(wallet.walletid,password,
              function(err, wallet) {
                if(err){
                  console.log(err);
                }else{
                 
                    console.log("----------");
                    wallet.getNewAddress((err, address)=>{
                      if(err){
                        console.log("Something wrong in generating address");
                      }else{
                        console.log("New address is ",address);
      
                        res.send({status:"success",message:"redirect to receive page",data:address});
                      }
                    });
                  }
                })
              }
            })
            
        })

        this.router.post('/balance',(req,res,next)=>{
          userSchema.findOne({walletid:req.body.walletid},(error,wallet)=>{
            if(error){
              console.log("Error in wallet retrival ",err);
            }else{
              client = blocktrail.BlocktrailSDK({apiKey: key, apiSecret: secret, network: "BTC", testnet: true});
                var password = CryptoJS.AES.decrypt(wallet.walletpassword,secretKey).toString(CryptoJS.enc.Utf8);
                console.log(password);
                client.initWallet(wallet.walletid,password,
                  function(err, wallet) {
                    if(err){
                      console.log(err);
                    }else{
                      console.log("----------");
                      wallet.getBalance(
                        function(err, confirmedBalance, unconfirmedBalance) {
                            console.log('Balance: ', blocktrail.toBTC(confirmedBalance));
                            console.log('Unconfirmed Balance: ', blocktrail.toBTC(unconfirmedBalance));
                            console.log("Success in retriving the balance")
                            res.send({status:"Success",message:"Success in retriving the balance",data:confirmedBalance})
                        });
                    }
                  });
            }
          })
            
          })


        }
      }

module.exports = new User().router;