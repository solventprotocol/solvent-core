import { web3, AnchorProvider } from "@project-serum/anchor";
import { getWalletBalanceWithMint } from "../../utils/helpers";
import {
  FLEXIBLE_TOKEN_STAKING_PROGRAM_ID,
  FLEXIBLE_VAULT_EMISSIONS,
  LOCKED_TOKEN_STAKING_PROGRAM_ID,
  LOCKED_VAULT_EMISSIONS,
  SVT_MINT,
  XSVT_MINT,
} from "../../constants";
import { getLockedSvtStaking } from "../../utils";

export async function getSvtBalance(
  connection: web3.Connection,
  walletAddress: web3.PublicKey
) {
  return await getWalletBalanceWithMint(connection, walletAddress, SVT_MINT);
}

export async function getxSvtBalance(
  connection: web3.Connection,
  walletAddress: web3.PublicKey
) {
  return await getWalletBalanceWithMint(connection, walletAddress, XSVT_MINT);
}

export async function getFlexibleStakingTokensStaked(
  connection: web3.Connection
) {
  const [tokenVaultFlexible] = await web3.PublicKey.findProgramAddress(
    [SVT_MINT.toBuffer()],
    FLEXIBLE_TOKEN_STAKING_PROGRAM_ID
  );
  const info = await connection.getTokenAccountBalance(tokenVaultFlexible);
  return info.value.uiAmount;
}

export async function getLockedStakingTokensStaked(
  connection: web3.Connection
) {
  const [tokenVaultFlexible] = await web3.PublicKey.findProgramAddress(
    [SVT_MINT.toBuffer()],
    LOCKED_TOKEN_STAKING_PROGRAM_ID
  );
  const info = await connection.getTokenAccountBalance(tokenVaultFlexible);
  return info.value.uiAmount;
}

export async function getLockedStakingUserShare(
  connection: web3.Connection,
  walletAddress: web3.PublicKey
) {
  const provider = new AnchorProvider(connection, null, null);
  const lockedStakingProgram = getLockedSvtStaking(provider);

  // Fetch the SVT staking pubkey: PDA for stored initializer key and lock end date
  const [stakingAddress] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("staking")],
    new web3.PublicKey(LOCKED_TOKEN_STAKING_PROGRAM_ID)
  );
  const totalStats = await lockedStakingProgram.account.stakingAccount.fetch(
    stakingAddress
  );

  // Fetth the user staking account fot stored deposit amount
  const [userStakingAddress] = await web3.PublicKey.findProgramAddress(
    [walletAddress.toBuffer()],
    new web3.PublicKey(LOCKED_TOKEN_STAKING_PROGRAM_ID)
  );
  const userStats = await lockedStakingProgram.account.userStakingAccount.fetch(
    userStakingAddress
  );

  const tokenTokensInVault = await getLockedStakingTokensStaked(connection);

  const totalXToken = totalStats.totalXToken.toNumber() / 10 ** 6;
  const userXToken = userStats.xTokenAmount.toNumber() / 10 ** 6;

  if (totalXToken === 0 || userXToken === 0) {
    return { userShareTotal: 0, userXToken: 0 };
  }

  const userXTokenShare = userXToken / totalXToken;

  return { userShareTotal: userXTokenShare * tokenTokensInVault, userXToken };
}

export async function getFlexibleStakingUserShare(
  connection: web3.Connection,
  walletAddress: web3.PublicKey
) {
  const userxSvtBalance = await getxSvtBalance(connection, walletAddress);

  const info = await connection.getTokenSupply(XSVT_MINT, "processed");
  const xSvtSupply = info.value.uiAmount;

  const userxSvtShare = userxSvtBalance / xSvtSupply;

  const totalTokensInVault = await getFlexibleStakingTokensStaked(connection);

  return userxSvtShare * totalTokensInVault;
}

export async function getLockedStakingApy(connection: web3.Connection) {
  const tokenBalanceVault = await getLockedStakingTokensStaked(connection);
  const apy =
    Math.pow(
      1 + (LOCKED_VAULT_EMISSIONS * 52) / (tokenBalanceVault * 365),
      365
    ) - 1;
  return apy * 100;
}

export async function getFlexibleStakingApy(connection: web3.Connection) {
  const tokenBalanceVault = await getFlexibleStakingTokensStaked(connection);
  const apy =
    Math.pow(
      1 + (FLEXIBLE_VAULT_EMISSIONS * 52) / (tokenBalanceVault * 365),
      365
    ) - 1;
  return apy * 100;
}
