import * as anchor from "@project-serum/anchor";
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token-latest";
import { SOLVENT_TREASURY } from "../../constants";
import { getSolvent, getSolventAuthority } from "../../utils";

/**
 * Unlock an NFT from a locker by paying premium with interest
 * @param provider Anchor provider
 * @param dropletMint Droplet mint associated with the bucket
 * @param nftMint Mint of the NFT to be unlocked
 * @param nftTokenAccount Token account to which the unlocked NFT would be sent, defaults to the associated token account of wallet
 * @param dropletTokenAccount Token account from which droplets would be burned, defaults to the associated token account of wallet
 * @returns Promise resolving to the transaction signature
 */
export const unlockNft = async (
  provider: anchor.AnchorProvider,
  dropletMint: anchor.web3.PublicKey,
  nftMint: anchor.web3.PublicKey,
  nftTokenAccount?: anchor.web3.PublicKey,
  dropletTokenAccount?: anchor.web3.PublicKey
) => {
  const solvent = getSolvent(provider);
  const transaction = new anchor.web3.Transaction();

  const solventAuthority = await getSolventAuthority();
  const solventTokenAccount = await getAssociatedTokenAddress(
    nftMint,
    solventAuthority,
    true
  );

  const solventTreasuryDropletAccount = await getAssociatedTokenAddress(
    dropletMint,
    SOLVENT_TREASURY
  );

  // Use wallet's ATA as the NFT token account if not passed as argument
  if (!nftTokenAccount) {
    nftTokenAccount = await getAssociatedTokenAddress(
      nftMint,
      provider.wallet.publicKey
    );
    // Check if the ATA exists, otherwise initialize it
    try {
      await getAccount(provider.connection, nftTokenAccount);
    } catch {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          provider.wallet.publicKey,
          nftTokenAccount,
          provider.wallet.publicKey,
          nftMint
        )
      );
    }
  }

  if (!dropletTokenAccount) {
    // Use wallet's ATA as the droplet token account if not passed as argument
    dropletTokenAccount = await getAssociatedTokenAddress(
      dropletMint,
      provider.wallet.publicKey
    );
  }

  // Unlock NFT from Solvent
  transaction.add(
    await solvent.methods
      .unlockNft()
      .accounts({
        signer: provider.wallet.publicKey,
        dropletMint,
        nftMint,
        signerDropletAccount: dropletTokenAccount,
        solventTokenAccount,
        destinationTokenAccount: nftTokenAccount,
        solventTreasury: SOLVENT_TREASURY,
        solventTreasuryDropletAccount,
      })
      .instruction()
  );

  // Send the transaction
  return await provider.sendAndConfirm(transaction);
};
