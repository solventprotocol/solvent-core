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
 * Deposit an NFT into a bucket and get droplets in exchange
 * @param provider Anchor provider
 * @param dropletMint Droplet mint associated with the bucket
 * @param nftMint Mint of the NFT to be deposited into the bucket
 * @param nftTokenAccount Token account holding the NFT to be deposited, defaults to the associated token account of wallet
 * @param dropletTokenAccount Token account to which droplets would be minted, defaults to the associated token account of wallet
 * @param whitelistProof Merkle proof of the NFT belonging to the collection whitelist, defaults to Solvent's collection database
 * @returns Promise resolving to the transaction signature
 */
export const depositNft = async (
  provider: anchor.AnchorProvider,
  dropletMint: anchor.web3.PublicKey,
  nftMint: anchor.web3.PublicKey,
  nftTokenAccount?: anchor.web3.PublicKey,
  dropletTokenAccount?: anchor.web3.PublicKey,
  whitelistProof?: number[][]
) => {
  const solvent = getSolvent(provider);
  const transaction = new anchor.web3.Transaction();

  const metadata = await getTokenMetadata(nftMint);

  // Use wallet's ATA as the NFT token account if not passed as argument
  if (!nftTokenAccount) {
    nftTokenAccount = await getAssociatedTokenAddress(
      nftMint,
      provider.wallet.publicKey
    );
  }

  const solventAuthority = await getSolventAuthority();
  const solventTokenAccount = await getAssociatedTokenAddress(
    nftMint,
    solventAuthority,
    true
  );

  if (!dropletTokenAccount) {
    // Use wallet's ATA as the droplet token account if not passed as argument
    dropletTokenAccount = await getAssociatedTokenAddress(
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
  }

  // whitelistProof is expected to be passed in case of v1 type of collection, can be null otherwise
  whitelistProof = whitelistProof ? whitelistProof : null;

  // Deposit NFT into Solvent
  transaction.add(
    await solvent.methods
      .depositNft(whitelistProof)
      .accounts({
        signer: provider.wallet.publicKey,
        dropletMint,
        nftMint,
        metadata,
        signerTokenAccount: nftTokenAccount,
        solventTokenAccount,
        destinationDropletAccount: dropletTokenAccount,
      })
      .instruction()
  );

  // Send the transaction
  return await provider.sendAndConfirm(transaction);
};
