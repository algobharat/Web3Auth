import { IProvider } from "@web3auth/base";
import algosdk from "algosdk";

export default class AlgorandRPC {
  private provider: IProvider;
  private account: string;

  constructor(provider: IProvider) {
    this.provider = provider;
    this.account = "";
  }

  getAlgorandKeyPair = async (): Promise<any> => {
    const privateKey = (await this.provider.request({
      method: "private_key",
    })) as string;
    var passphrase = algosdk.secretKeyToMnemonic(
      Buffer.from(privateKey, "hex")
    );
    var keyPair = algosdk.mnemonicToSecretKey(passphrase);
    return keyPair;
  };

  getAccounts = async (): Promise<any> => {
    const keyPair = await this.getAlgorandKeyPair();
    this.account = keyPair.addr;
    return keyPair.addr;
  };

  getBalance = async (): Promise<any> => {
    try {
      //   const keyPair = await this.getAlgorandKeyPair();
      //   const client = await this.makeClient();
      //   console.log(client.url);

      //   const balance = await client.accountInformation(keyPair.addr).do();
      // console.log(balance.url);

      // return balance.amount;

      const acc = await this.getAccounts();
      const res = await fetch(
        `https://testnet-api.algonode.cloud/v2/accounts/${acc}`
      );
      const data = await res.json();

      return data.amount;
    } catch (error) {
      console.log(error);
    }
  };

  makeClient = async (): Promise<any> => {
    const algodToken = {
      "x-api-key": "yay5jiXMXr88Bi8nsG1Af9E1X3JfwGOC2F7222r3",
    };
    const algodServer = "https://testnet-api.algonode.cloud";
    const algodPort = "";
    let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
    const client = algodClient;
    console.log(client);

    return client;
  };

  signMessage = async (): Promise<any> => {
    const acc = await this.getAccounts();
    const keyPair = await this.getAlgorandKeyPair();
    const client = await this.makeClient();
    // const acctInfo = await client.accountInformation(acct.addr).do();
    // console.log(`Account balance: ${acctInfo.amount} microAlgos`);
    // const params = await client.getTransactionParams().do();
    // console.log(params);

    // const enc = new TextEncoder();
    // const message = enc.encode("Web3Auth says hello!");
   
    
    const suggestedParams = await client.getTransactionParams().do();
    // const data = await fetch("https://testnet-api.algonode.cloud/v2/transactions/params/")
    // const suggestedParams:any= await data.json()
    // console.log(suggestedParams);
    
    const ptxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: keyPair.addr,
      suggestedParams,
      to: keyPair.addr,
      amount: 1000,
      note: new Uint8Array(Buffer.from("Akshay says hello!")),
    });
    // const txn = algosdk.makePaymentTxnWithSuggestedParams(
    //   keyPair.addr,
    //   keyPair.addr,
    //   0,
    //   undefined,
    //   message,
    //   params
    // );
    const signedTxn = ptxn.signTxn(keyPair.sk);
    // let signedTxn = algosdk.signTransaction(txn, keyPair.sk);
    let txId = signedTxn;
    return txId;
  };

  signAndSendTransaction = async (): Promise<any> => {
    try {
      const keyPair = await this.getAlgorandKeyPair();
      const client = await this.makeClient();
      const params = await client.getTransactionParams().do();
      const enc = new TextEncoder();
      const message = enc.encode("Web3Auth says hello!");

      // You need to have some funds in your account to send a transaction
      // You can get some testnet funds here: https://bank.testnet.algorand.network/

      const txn = algosdk.makePaymentTxnWithSuggestedParams(
        keyPair.addr, // sender
        keyPair.addr, // receiver
        1000,
        undefined,
        message,
        params
      );
      let signedTxn = algosdk.signTransaction(txn, keyPair.sk);

      const txHash = await client.sendRawTransaction(signedTxn.blob).do();

      return txHash.txId;
    } catch (error) {
      console.log(error);
    }
  };
}
