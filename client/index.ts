import {
    createKeyPairSignerFromBytes,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    createTransactionMessage,
    appendTransactionMessageInstructions,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    signTransactionMessageWithSigners,
    assertIsSendableTransaction,
    assertIsTransactionWithBlockhashLifetime,
    sendAndConfirmTransactionFactory,
    getSignatureFromTransaction,
    lamports,
    generateKeyPairSigner,
    type Address,
} from "@solana/kit";
import { getSetComputeUnitLimitInstruction } from "@solana-program/compute-budget";
import { fileURLToPath } from "url";

import fs from "fs";
import path from "path";


const RPC_URL = "https://api.devnet.solana.com";
const PROGRAM_ID = "68V29RzWpHhYS5qdu9ovcAfDCLeddhYMH7vafy53PvdB"

// generate new keypair for the client

// airdrop sol to the client

export interface ProofResult {
    proof: Buffer;
    publicWitness: Buffer;
}



async function verifyProofOnChain(instructionData: Buffer,
): Promise<string> {

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    console.log({ __dirname });
    const basePath = path.resolve(
        __dirname,
        "deployer.json",
    );

    const keypairBytes = new Uint8Array(
        JSON.parse(fs.readFileSync(basePath, "utf-8"))
    );

    const wallet = await createKeyPairSignerFromBytes(keypairBytes);
    console.log({ wallet })


    const rpc = createSolanaRpc(RPC_URL);
    console.log({ rpc })

    const rpcSubscriptions = createSolanaRpcSubscriptions(
        RPC_URL.replace("https://", "wss://").replace("http://", "ws://")
    );


    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const computeUnits = 500_000;

    const verifyInstruction = {
        programAddress: PROGRAM_ID,
        accounts: [],
        data: new Uint8Array(instructionData),
    };

    const baseMessage = createTransactionMessage({ version: 0 });
    console.log({ baseMessage })
    const messageWithPayer = setTransactionMessageFeePayerSigner(
        wallet,
        baseMessage
    );
    const messageWithLifetime = setTransactionMessageLifetimeUsingBlockhash(
        latestBlockhash,
        messageWithPayer
    );
    console.log({ messageWithLifetime })

    const transactionMessage = appendTransactionMessageInstructions(
        [
            getSetComputeUnitLimitInstruction({ units: computeUnits }),
            verifyInstruction,
        ],
        messageWithLifetime
    );

    const signedTransaction =
        await signTransactionMessageWithSigners(transactionMessage);
    assertIsSendableTransaction(signedTransaction);
    assertIsTransactionWithBlockhashLifetime(signedTransaction);

    console.log("Sending verification transaction...");
    const sendAndConfirm = sendAndConfirmTransactionFactory({
        rpc,
        rpcSubscriptions,
    });
    await sendAndConfirm(signedTransaction, { commitment: "confirmed" });

    const sig = getSignatureFromTransaction(signedTransaction);
    console.log("\n✅ Proof verified successfully on-chain!");
    printTransactionResult(sig);
    return sig;
}
export function printTransactionResult(
    sig: string,
    cluster: string = "devnet"
): void {
    console.log(
        `\nTransaction: https://explorer.solana.com/tx/${sig}?cluster=${cluster}`
    );
}


export function createInstructionData(proofResult: ProofResult): Buffer {
    return Buffer.concat([proofResult.proof, proofResult.publicWitness]);
}


export function readProofFiles() {

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const basePath = path.resolve(
        __dirname,
        "..",
        "simple_sum",
        "target"
    );

    const proof = fs.readFileSync(path.join(basePath, "simple_sum.proof"));
    console.log(proof)
    const publicWitness = fs.readFileSync(path.join(basePath, "simple_sum.pw"));
    console.log(publicWitness)
    return { proof, publicWitness };
}


const main = async () => {
    const proofResult = readProofFiles();

    const instructionData = createInstructionData(proofResult);
    console.log(`Total instruction data: ${instructionData.length} bytes\n`);

    const sig = await verifyProofOnChain(instructionData);

    console.log({ sig })
}

main();