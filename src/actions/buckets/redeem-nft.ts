import * as anchor from "@project-serum/anchor";
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token-latest";
import { SOLVENT_CORE_TREASURY } from "../../constants";
import { getSolventAuthority, getSolvent } from "../../utils";

/**
 * Redeem an NFT from a bucket and burn droplets in exchange
 * @param provider Anchor provider
 * @param dropletMint Droplet mint associated with the bucket
 * @param nftMint Mint of the NFT to be redeemed from the bucket
 * @param nftTokenAccount Token account to which the redeemed NFT is to be sent, defaults to the associated token account of wallet
 * @param dropletTokenAccount Token account from which droplets would be burned, defaults to the associated token account of wallet
 * @returns Promise resolving to the transaction signature
 */
export const redeemNft = async (
  provider: anchor.AnchorProvider,
  dropletMint: anchor.web3.PublicKey,
  nftMint: anchor.web3.PublicKey,
  isSwap: boolean = false,
  nftTokenAccount?: anchor.web3.PublicKey,
  dropletTokenAccount?: anchor.web3.PublicKey
) => {
  const solvent = getSolvent(provider);
  const transaction = new anchor.web3.Transaction();

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

  // Use wallet's ATA as the droplet token account if not passed as argument
  if (!dropletTokenAccount) {
    dropletTokenAccount = await getAssociatedTokenAddress(
      dropletMint,
      provider.wallet.publicKey
    );
  }

  const solventAuthority = await getSolventAuthority();
  const solventNftTokenAccount = await getAssociatedTokenAddress(
    nftMint,
    solventAuthority,
    true
  );

  const solventTreasuryDropletTokenAccount = await getAssociatedTokenAddress(
    dropletMint,
    SOLVENT_CORE_TREASURY
  );

  // Redeem NFT and burn droplets in the process
  transaction.add(
    await solvent.methods
      .redeemNft(isSwap)
      .accounts({
        signer: provider.wallet.publicKey,
        dropletMint,
        nftMint,
        solventNftTokenAccount,
        destinationNftTokenAccount: nftTokenAccount,
        signerDropletTokenAccount: dropletTokenAccount,
        solventTreasury: SOLVENT_CORE_TREASURY,
        solventTreasuryDropletTokenAccount,
      })
      .instruction()
  );

  // Send the transaction
  return await provider.sendAndConfirm(transaction);
};
