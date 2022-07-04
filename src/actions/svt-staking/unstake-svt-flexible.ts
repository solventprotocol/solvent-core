import * as anchor from "@project-serum/anchor";
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token-latest";
import {
  FLEXIBLE_TOKEN_STAKING_PROGRAM_ID,
  SVT_MINT,
  XSVT_MINT,
} from "../../constants";
import { getFlexibleSvtStaking } from "../../utils";

export const unstakeSvtFlexible = async (
  provider: anchor.AnchorProvider,
  amount: number,
  svtTokenAccount?: anchor.web3.PublicKey,
  xsvtTokenAccount?: anchor.web3.PublicKey
) => {
  const flexibleSvtStaking = getFlexibleSvtStaking(provider);

  const transaction = new anchor.web3.Transaction();

  // Use wallet's ATA as the token account if not passed as argument
  if (!svtTokenAccount) {
    svtTokenAccount = await getAssociatedTokenAddress(
      SVT_MINT,
      provider.wallet.publicKey
    );
    // Check if the ATA exists, otherwise initialize it
    try {
      await getAccount(provider.connection, svtTokenAccount);
    } catch {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          provider.wallet.publicKey,
          svtTokenAccount,
          provider.wallet.publicKey,
          SVT_MINT
        )
      );
    }
  }

  // Use wallet's ATA as the token account if not passed as argument
  if (!xsvtTokenAccount) {
    xsvtTokenAccount = await getAssociatedTokenAddress(
      XSVT_MINT,
      provider.wallet.publicKey
    );
  }

  // Create token vault PDA
  const [tokenVault, tokenVaultBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [SVT_MINT.toBuffer()],
      FLEXIBLE_TOKEN_STAKING_PROGRAM_ID
    );

  // Burn XSVT and get SVT in return
  transaction.add(
    await flexibleSvtStaking.methods
      .unstake(tokenVaultBump, new anchor.BN(amount))
      .accounts({
        tokenMint: SVT_MINT,
        xTokenMint: XSVT_MINT,
        xTokenFrom: xsvtTokenAccount,
        xTokenFromAuthority: provider.wallet.publicKey,
        tokenVault,
        tokenTo: svtTokenAccount,
      })
      .instruction()
  );

  return await provider.sendAndConfirm(transaction);
};
