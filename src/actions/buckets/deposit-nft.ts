import * as anchor from "@project-serum/anchor";
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token-latest";
import { getSolventAuthority, getTokenMetadata, getSolvent } from "../../utils";

/**
 * Deposit an NFT into a bucket and get droplets in exchange
 * @param provider Anchor provider
 * @param dropletMint Droplet mint associated with the bucket
 * @param nftMint Mint of the NFT to be deposited into the bucket
 * @param whitelistProof Merkle proof of the NFT belonging to the collection whitelist, defaults to Solvent's collection database
 * @param nftTokenAccount Token account holding the NFT to be deposited, defaults to the associated token account of wallet
 * @param dropletTokenAccount Token account to which droplets would be minted, defaults to the associated token account of wallet
 * @returns Promise resolving to the transaction signature
 */
export const depositNft = async (
  provider: anchor.AnchorProvider,
  dropletMint: anchor.web3.PublicKey,
  nftMint: anchor.web3.PublicKey,
  whitelistProof?: number[][],
  nftTokenAccount?: anchor.web3.PublicKey,
  dropletTokenAccount?: anchor.web3.PublicKey
) => {
  const solvent = getSolvent(provider);
  const transaction = new anchor.web3.Transaction();

  const nftMetadata = await getTokenMetadata(nftMint);

  // Use wallet's ATA as the NFT token account if not passed as argument
  if (!nftTokenAccount) {
    nftTokenAccount = await getAssociatedTokenAddress(
      nftMint,
      provider.wallet.publicKey
    );
  }

  const solventAuthority = await getSolventAuthority();
  const solventNftTokenAccount = await getAssociatedTokenAddress(
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
      .depositNft(false, whitelistProof)
      .accounts({
        signer: provider.wallet.publicKey,
        dropletMint,
        nftMint,
        nftMetadata,
        signerNftTokenAccount: nftTokenAccount,
        solventNftTokenAccount,
        destinationDropletTokenAccount: dropletTokenAccount,
      })
      .instruction()
  );

  // Send the transaction
  return await provider.sendAndConfirm(transaction);
};
