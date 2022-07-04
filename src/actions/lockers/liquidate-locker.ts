import * as anchor from "@project-serum/anchor";
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token-latest";
import { SOLVENT_TREASURY } from "../../constants";
import { getSolventAuthority, getSolvent } from "../../utils";

/**
 * Unlock an NFT from a locker by paying premium with interest
 * @param provider Anchor provider
 * @param dropletMint Droplet mint associated with the bucket
 * @param nftMint Mint of the NFT to be unlocked
 * @param dropletTokenAccount Token account to which liquidation rewards would be sent, defaults to the associated token account of wallet
 * @returns Promise resolving to the transaction signature
 */
export const liquidateLocker = async (
  provider: anchor.AnchorProvider,
  dropletMint: anchor.web3.PublicKey,
  nftMint: anchor.web3.PublicKey,
  dropletTokenAccount?: anchor.web3.PublicKey
) => {
  const solvent = getSolvent(provider);
  const transaction = new anchor.web3.Transaction();

  const solventTreasuryDropletAccount = await getAssociatedTokenAddress(
    dropletMint,
    SOLVENT_TREASURY
  );

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

  // Liquidate a locker which has defaulted
  transaction.add(
    await solvent.methods
      .liquidateLocker()
      .accounts({
        signer: provider.wallet.publicKey,
        dropletMint,
        nftMint,
        solventTokenAccount,
        solventTreasury: SOLVENT_TREASURY,
        solventTreasuryDropletAccount,
        signerDropletAccount: dropletTokenAccount,
      })
      .instruction()
  );

  // Send the transaction
  return await provider.sendAndConfirm(transaction);
};
