import { Request, Response, NextFunction } from 'express';
import axios, { AxiosResponse } from 'axios';
// import { getMints } from "../util/get-mints"; 
import { from } from "rxjs";
import { mergeMap, toArray, map, tap } from "rxjs/operators";

// import { Connection, PublicKey } from "@solana/web3.js";
import { deserializeUnchecked } from "borsh";
// import { Token, TOKEN_PROGRAM_ID as TOKENPROGRAMID } from "@solana/spl-token";
import { web3 } from "@project-serum/anchor";

const anchor = require("@project-serum/anchor");
const fs = require("fs");

//@ts-ignore
import jsonFormat from "json-format";

export type StringPublicKey = string;

const PubKeysInternedMap = new Map<string, PublicKey>();

export const toPublicKey = (key: string | PublicKey | Uint8Array): any => {
  if (key instanceof PublicKey) {
    return key;
  }

  if (typeof key === 'string') {
    let result = PubKeysInternedMap.get(key);
    if (!result) {
      result = new PublicKey(key);
      PubKeysInternedMap.set(key, result);
    }

    return result;
  }

  if (key instanceof Uint8Array) {
    const result = new PublicKey(key);
    PubKeysInternedMap.set(result.toBase58(), result);
    return result;
  }
};


export const METADATA_PROGRAM_ID =
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s" as StringPublicKey;

export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

const connection = new anchor.web3.Connection(
  "https://small-falling-star.solana-mainnet.quiknode.pro/573b93e6e0a21ac1d36a9ddca06348dbc3d0123f/"
);

export class Creator {
  address: PublicKey;
  verified: boolean;
  share: number;

  constructor(args: { address: PublicKey; verified: boolean; share: number }) {
    this.address = args.address;
    this.verified = args.verified;
    this.share = args.share;
  }
}

class Holder {
    address: PublicKey;
    count: number;
}

export class Data {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: Creator[] | null;
  constructor(args: {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: Creator[] | null;
  }) {
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
    this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
    this.creators = args.creators;
  }
}

export enum MetadataKey {
  Uninitialized = 0,
  MetadataV1 = 4,
  EditionV1 = 1,
  MasterEditionV1 = 2,
  MasterEditionV2 = 6,
  EditionMarker = 7,
}

export class Metadata {
  key: MetadataKey;
  updateAuthority: PublicKey;
  mint: PublicKey;
  data: Data;
  primarySaleHappened: boolean;
  isMutable: boolean;
  masterEdition?: PublicKey;
  edition?: PublicKey;
  constructor(args: {
    updateAuthority: PublicKey;
    mint: PublicKey;
    data: Data;
    primarySaleHappened: boolean;
    isMutable: boolean;
    masterEdition?: PublicKey;
  }) {
    this.key = MetadataKey.MetadataV1;
    this.updateAuthority = args.updateAuthority;
    this.mint = args.mint;
    this.data = args.data;
    this.primarySaleHappened = args.primarySaleHappened;
    this.isMutable = args.isMutable;
  }
}

export const METADATA_SCHEMA = new Map<any, any>([
  [
    Data,
    {
      kind: "struct",
      fields: [
        ["name", "string"],
        ["symbol", "string"],
        ["uri", "string"],
        ["sellerFeeBasisPoints", "u16"],
        ["creators", { kind: "option", type: [Creator] }],
      ],
    },
  ],
  [
    Creator,
    {
      kind: "struct",
      fields: [
        ["address", [32]],
        ["verified", "u8"],
        ["share", "u8"],
      ],
    },
  ],
  [
    Metadata,
    {
      kind: "struct",
      fields: [
        ["key", "u8"],
        ["updateAuthority", [32]],
        ["mint", [32]],
        ["data", Data],
        ["primarySaleHappened", "u8"],
        ["isMutable", "u8"],
      ],
    },
  ],
]);


const wallet = anchor.web3.Keypair.fromSecretKey(new Uint8Array([20,30,235,255,210,204,47,155,52,171,140,93,51,69,143,196,188,210,20,15,117,214,67,234,3,86,254,23,150,61,253,102,48,228,169,52,56,14,21,18,175,215,63,72,251,171,140,162,72,84,48,194,36,67,35,212,240,200,228,165,199,175,47,118,]));

const mintPublicKey = new web3.PublicKey("AV6gqaypJ2WK2f4eLtUDU2iyBDjbzuLt7Q5S2wLHUsbY");    


const getNftOwner = async (address) => {
  try {
    let filter = {
      memcmp: {
        offset: 0,
        bytes: address,
      },
    };
    let filter2 = {
      dataSize: 165,
    };
    let getFilter = [filter, filter2];
    let programAccountsConfig = { filters: getFilter, encoding: "jsonParsed" };
    let _listOfTokens = await connection.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID,
      programAccountsConfig
    );

    let res;
    for (let i = 0; i < _listOfTokens.length; i++) {
      if (
        _listOfTokens[i]["account"]["data"]["parsed"]["info"]["tokenAmount"][
          "amount"
        ] == 1
      ) {
        res = _listOfTokens[i]["account"]["data"]["parsed"]["info"]["owner"];
        // console.log(_listOfTokens[i]["account"]["data"]["parsed"]["info"]["owner"]);
        // console.log(
        //   _listOfTokens[i]["account"]["data"]["parsed"]["info"]["tokenAmount"][
        //     "amount"
        //   ]);
      }
    }

    return res;
  } catch (e) {
    console.log(e);
  }
};


// async function transfer(tokenMintAddress: string, wallet: any, to: string, connection: web3.Connection, amount: number) {
//   const mintToken = new Token(
//     connection,
//     mintPublicKey,
//     TOKEN_PROGRAM_ID,
//     wallet // the wallet owner will pay to transfer and to create recipients associated token account if it does not yet exist.
//   );
        
//   const fromTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(
//     wallet.publicKey
//   );

//   const destPublicKey = new web3.PublicKey(to);

//   // Get the derived address of the destination wallet which will hold the custom token
//   const associatedDestinationTokenAddr = await Token.getAssociatedTokenAddress(
//     mintToken.associatedProgramId,
//     mintToken.programId,
//     mintPublicKey,
//     destPublicKey
//   );

//   const receiverAccount = await connection.getAccountInfo(associatedDestinationTokenAddr);
        
//   const instructions: web3.TransactionInstruction[] = [];  

//   if (receiverAccount === null) {

//     instructions.push(
//       Token.createAssociatedTokenAccountInstruction(
//         mintToken.associatedProgramId,
//         mintToken.programId,
//         mintPublicKey,
//         associatedDestinationTokenAddr,
//         destPublicKey,
//         wallet.publicKey
//       )
//     )

//   }
  
//   instructions.push(
//     Token.createTransferInstruction(
//       TOKEN_PROGRAM_ID,
//       fromTokenAccount.address,
//       associatedDestinationTokenAddr,
//       wallet.publicKey,
//       [],
//       amount
//     )
//   );

//   const transaction = new web3.Transaction().add(...instructions);
//   transaction.feePayer = wallet.publicKey;
//   transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
//   console.log(transaction);
//   const transactionSignature = await connection.sendRawTransaction(
//     transaction.serialize(),
//     { skipPreflight: true }
//   );

//   await connection.confirmTransaction(transactionSignature);
// }

const getHolders = async ( mints_arr: string[] ) => {
    const holders = [];
    let flag = false;
    for (let i = 0; i <= mints_arr.length-1; i++) {
        const holderN = await getNftOwner(mints_arr[i]);
        if (holders.length >= 1) {
            flag = false;
            for (let j = 0; j <= holders.length-1; j++) {
                // console.log("holder: ", holderN, "  nth: ", holders[j].holder, "=", holders[j].holder.indexOf(holderN), "amount: ", holders[j].amount);
                if(holders[j].holder.indexOf(holderN)!= -1) {
                    holders[j].amount += 1;
                    flag = true;
                }
            }
            if(!flag){
                holders.push({holder: holderN , amount: 1});
            }
        } else {
            holders.push({holder: holderN , amount: 1});
        }

    }
    for (let index = 0; index < holders.length; index++) {
        console.log("holders ", holders[index]);
    }
    // return newList.push({ mint: data[i], holder: await getNftOwner(data[i]) });
};

import * as web3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";

// Address: 9vpsmXhZYMpvhCKiVoX5U8b1iKpfwJaFpPEEXF7hRm9N
const DEMO_WALLET_SECRET_KEY = new Uint8Array([37, 21, 197, 185, 105, 201, 212, 148, 164, 108, 251, 159, 174, 252, 43, 246, 225, 156, 38, 203, 99, 42, 244, 73, 252, 143, 34, 239, 15, 222, 217, 91, 132, 167, 105, 60, 17, 211, 120, 243, 197, 99, 113, 34, 76, 127, 190, 18, 91, 246, 121, 93, 189, 55, 165, 129, 196, 104, 25, 157, 209, 168, 165, 149, ]);

// getting all posts
const getPosts = async (req: Request, res: Response, next: NextFunction) => {
    // const connection = new Connection("https://pentacle.genesysgo.net");
    const wallet = anchor.web3.Keypair.fromSecretKey(new Uint8Array([141,138,151,68,156,135,63,9,27,44,52,235,126,229,187,158,150,24,186,175,10,131,149,26,40,47,174,188,88,49,28,65,233,219,146,247,217,112,173,188,175,202,173,50,157,91,69,123,68,232,207,255,57,120,35,236,233,42,131,82,64,218,86,92]));
    // const wallet = anchor.web3.Keypair.fromSecretKey(new Uint8Array([20,30,235,255,210,204,47,155,52,171,140,93,51,69,143,196,188,210,20,15,117,214,67,234,3,86,254,23,150,61,253,102,48,228,169,52,56,14,21,18,175,215,63,72,251,171,140,162,72,84,48,194,36,67,35,212,240,200,228,165,199,175,47,118,]));
    // const a = await connection.getProgramAccounts(
    //     toPublicKey(METADATA_PROGRAM_ID),
    //     {
    //     encoding: "base64",
    //     filters: [
    //         {
    //         memcmp: {
    //             offset: 326,
    //             bytes: "EuvjzBwTTZ7t5TAVviJKJtsQLNxsURkoNRinnE8LJtVD",
    //         },
    //         },
    //     ],
    //     }
    // );
    // const deserialized = a.map((b) =>
    //     deserializeUnchecked(METADATA_SCHEMA, Metadata, b.account.data)
    // );

    // const parsed_data = jsonFormat(
    //   deserialized.map((g) => new PublicKey(g.mint).toBase58()),
    //   {
    //     type: "space",
    //     size: 2,
    //   }
    // );
    // const mints = deserialized.map((g) => new PublicKey(g.mint).toBase58());

    // const holders = await getHolders(deserialized.map((g) => new PublicKey(g.mint).toBase58()));
    // console.log(holders);
    var connection = new web3.Connection(web3.clusterApiUrl("devnet"));

    // await transfer("AV6gqaypJ2WK2f4eLtUDU2iyBDjbzuLt7Q5S2wLHUsbY", wallet, "9oFUqjdzZoj3XKvNo5QtD2HKFakNfdAkAVDMG1GhHeRm", connection, 50);


    (async () => {
      // Connect to cluster
      var connection = new web3.Connection(web3.clusterApiUrl("devnet"));
      // Construct wallet keypairs
      var fromWallet = web3.Keypair.fromSecretKey(DEMO_WALLET_SECRET_KEY);
      var toWallet = web3.Keypair.generate();
      // Construct my token class
      var myMint = new web3.PublicKey("AV6gqaypJ2WK2f4eLtUDU2iyBDjbzuLt7Q5S2wLHUsbY");
      var myToken = new splToken.Token(
        connection,
        myMint,
        splToken.TOKEN_PROGRAM_ID,
        fromWallet
      );
      // Create associated token accounts for my token if they don't exist yet
      var fromTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
        fromWallet.publicKey
      )
      var toTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
        toWallet.publicKey
      )
      // Add token transfer instructions to transaction
      var transaction = new web3.Transaction()
        .add(
          splToken.Token.createTransferInstruction(
            splToken.TOKEN_PROGRAM_ID,
            fromTokenAccount.address,
            toTokenAccount.address,
            fromWallet.publicKey,
            [],
            0
          )
        );
      // Sign transaction, broadcast, and confirm
      var signature = await web3.sendAndConfirmTransaction(
        connection,
        transaction,
        [fromWallet]
      );
      console.log("SIGNATURE", signature);
      console.log("SUCCESS");
    })();


    return res.status(200).json({
        // message: holders
        message: "holders"
    });

};

export default { getPosts };
