import * as anchor from "@project-serum/anchor";
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token-latest";
import {
  getSolventAuthority,
  getTokenMetadata,
  getSolvent,
  getMerkleProof,
} from "../../utils";
import { getBucket } from "./get-bucket";

/**
 * Swap an NFT for another on in a bucket
 * @param provider Anchor provider
 * @param dropletMint Droplet mint associated with the bucket
 * @param nftToDepositMint Mint of the NFT to be deposited into the bucket
 * @param nftToRedeemMint Mint of the NFT to be redeemed from the bucket
 * @param nftToDepositTokenAccount Token account from which NFT will be deposited, defaults to the associated token account of wallet
 * @param nftToRedeemTokenAccount Token account to which the redeemed NFT is to be sent, defaults to the associated token account of wallet
 * @param whitelistProof Merkle proof of the NFT to be deposited belonging to the collection whitelist, defaults to Solvent's collection database
 * @returns Promise resolving to the transaction signature
 */
export const swapNft = async (
  provider: anchor.AnchorProvider,
  dropletMint: anchor.web3.PublicKey,
  nftToDepositMint: anchor.web3.PublicKey,
  nftToRedeemMint: anchor.web3.PublicKey,
  nftToDepositTokenAccount?: anchor.web3.PublicKey,
  nftToRedeemTokenAccount?: anchor.web3.PublicKey,
  whitelistProof?: number[][]
) => {
  const solvent = getSolvent(provider);
  const transaction = new anchor.web3.Transaction();

  const nftToDeposiMetadata = await getTokenMetadata(nftToDepositMint);

  // Use wallet's ATA as the NFT token account if not passed as argument
  if (!nftToRedeemTokenAccount) {
    nftToRedeemTokenAccount = await getAssociatedTokenAddress(
      nftToRedeemMint,
      provider.wallet.publicKey
    );
    // Check if the ATA exists, otherwise initialize it
    try {
      await getAccount(provider.connection, nftToRedeemTokenAccount);
    } catch {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          provider.wallet.publicKey,
          nftToRedeemTokenAccount,
          provider.wallet.publicKey,
          nftToRedeemMint
        )
      );
    }
  }

  // Use wallet's ATA as the NFT token account if not passed as argument
  if (!nftToDepositTokenAccount) {
    nftToDepositTokenAccount = await getAssociatedTokenAddress(
      nftToDepositMint,
      provider.wallet.publicKey
    );
  }

  // Solvent's NFT token accounts
  const solventAuthority = await getSolventAuthority();
  const solventNftToDepositTokenAccount = await getAssociatedTokenAddress(
    nftToDepositMint,
    solventAuthority,
    true
  );
  const solventNftToRedeemTokenAccount = await getAssociatedTokenAddress(
    nftToRedeemMint,
    solventAuthority,
    true
  );

  // Use wallet's ATA as the droplet token account
  const dropletTokenAccount = await getAssociatedTokenAddress(
    dropletMint,
    provider.wallet.publicKey
  );
  // Check if the ATA exists, otherwise initialize it
  try {
    await getAccount(provider.connection, dropletTokenAccount);
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        dropletTokenAccount,
        provider.wallet.publicKey,
        dropletMint
      )
    );
  }

  // whitelistProof is expected to be passed in case of v1 type of collection, can be null otherwise
  whitelistProof = whitelistProof ? whitelistProof : null;

  // Deposit NFT
  transaction.add(
    await solvent.methods
      .depositNft(whitelistProof)
      .accounts({
        signer: provider.wallet.publicKey,
        dropletMint,
        nftMint: nftToDepositMint,
        metadata: nftToDeposiMetadata,
        signerTokenAccount: nftToDepositTokenAccount,
        solventTokenAccount: solventNftToDepositTokenAccount,
        destinationDropletAccount: dropletTokenAccount,
      })
      .instruction()
  );

  // Redeem NFT
  transaction.add(
    await solvent.methods
      .redeemNft()
      .accounts({
        signer: provider.wallet.publicKey,
        dropletMint,
        nftMint: nftToRedeemMint,
        solventTokenAccount: solventNftToRedeemTokenAccount,
        destinationTokenAccount: nftToRedeemTokenAccount,
        signerDropletAccount: dropletTokenAccount,
      })
      .instruction()
  );

  // Send the transaction
  return await provider.sendAndConfirm(transaction);
};
