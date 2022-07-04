import {
  feeAccount,
  findFarmerPDA,
  GEM_BANK_PROG_ID,
  GEM_FARM_PROG_ID,
  RewardType,
} from "@gemworks/gem-farm-ts";
import * as anchor from "@project-serum/anchor";
import {
  createMint,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token-latest";
import { assert, expect } from "chai";
import {
  createBucket,
  depositNft,
  getBucket,
  lockNft,
  redeemNft,
  unlockNft,
  liquidateLocker,
  swapNft,
  updateLockingParams,
  setLockingEnabled,
  setStakingEnabled,
  updateStakingParams,
  stakeNft,
  unstakeNft,
} from "../src/actions";
import {
  getFarmerAuthority,
  getMerkleProof,
  getMerkleTree,
  getSolventAuthority,
} from "../src/utils";
import {
  createKeypair,
  getGemBank,
  getGemFarm,
  getSolventAdminKeypair,
  mintNft,
  verifyCollection,
} from "./utils";

describe("Solvent Core", function () {
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  const solventAdminKeypair = getSolventAdminKeypair();
  const adminProvider = new anchor.AnchorProvider(
    provider.connection,
    new anchor.Wallet(solventAdminKeypair),
    anchor.AnchorProvider.defaultOptions()
  );

  const gemFarm = getGemFarm(provider);
  const gemBank = getGemBank(provider);

  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        provider.wallet.publicKey,
        10 * anchor.web3.LAMPORTS_PER_SOL
      )
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        adminProvider.wallet.publicKey,
        10 * anchor.web3.LAMPORTS_PER_SOL
      )
    );
  });

  describe("can create bucket", () => {
    it("for Metaplex v1.1 collections", async () => {
      // Setup: Mint a collection NFT
      const collectionCreator = await createKeypair(provider);
      const collectionMint = await mintNft(
        provider,
        collectionCreator,
        collectionCreator.publicKey
      );

      // Create bucket
      const [dropletMint] = await createBucket(provider, {
        collectionMint,
      });

      // Fetch BucketState and ensure it has correct contents
      const bucketState = await getBucket(provider.connection, dropletMint);
      expect(bucketState.dropletMint.toBase58()).to.equal(
        dropletMint.toBase58()
      );
      // @ts-ignore
      expect(bucketState.collectionInfo.v2.collectionMint.toBase58()).to.equal(
        collectionMint.toBase58()
      );
    });

    it("for Metaplex v1.0 collections", async () => {
      // Setup: Have a list of verified creators and symbol
      const symbol = "SMB";
      const verifiedCreators = [...Array(5)].map(
        () => new anchor.web3.Keypair().publicKey
      );

      const mints = [...Array(5)].map(
        () => new anchor.web3.Keypair().publicKey
      );

      const whitelistRoot = getMerkleTree(mints).root;

      // Create bucket
      const [dropletMint] = await createBucket(provider, {
        symbol,
        verifiedCreators,
        whitelistRoot,
      });

      // Fetch BucketState and ensure it has correct contents
      const bucketState = await getBucket(provider.connection, dropletMint);
      expect(bucketState.dropletMint.toBase58()).to.equal(
        dropletMint.toBase58()
      );
      // @ts-ignore
      expect(bucketState.collectionInfo.v1.symbol).to.equal(symbol);
      expect(
        // @ts-ignore
        bucketState.collectionInfo.v1.verifiedCreators.map(
          (value: anchor.web3.PublicKey) => value.toBase58()
        )
      ).to.have.same.members(verifiedCreators.map((value) => value.toBase58()));
    });
  });

  describe("can deposit NFT in bucket", () => {
    it("for Metaplex v1.1 collections", async () => {
      // Setup: Mint a collection NFT and create bucket
      const collectionCreator = await createKeypair(provider);
      const collectionMint = await mintNft(
        provider,
        collectionCreator,
        collectionCreator.publicKey
      );
      const [dropletMint] = await createBucket(provider, {
        collectionMint,
      });

      // Setup: mint an NFT from that collection
      const nftCreator = await createKeypair(provider);
      const nftMint = await mintNft(
        provider,
        nftCreator,
        provider.wallet.publicKey,
        collectionMint
      );
      await verifyCollection(
        provider,
        nftMint,
        collectionMint,
        collectionCreator
      );

      // Deposit NFT
      await depositNft(provider, dropletMint, nftMint);
    });

    it("for Metaplex v1.0 collections", async () => {
      // Setup: mint an NFT
      const nftCreator = await createKeypair(provider);
      const nftMint = await mintNft(
        provider,
        nftCreator,
        provider.wallet.publicKey,
        null,
        true
      );

      const mints = [...Array(5)].map(
        () => new anchor.web3.Keypair().publicKey
      );

      // Setup: Create bucket

      const { root: whitelistRoot, tree } = getMerkleTree([...mints, nftMint]);
      const [dropletMint] = await createBucket(provider, {
        verifiedCreators: [nftCreator.publicKey],
        symbol: "PCN",
        whitelistRoot,
      });

      // Deposit NFT
      const whitelistProof = getMerkleProof([...mints, nftMint], nftMint);
      try {
        await depositNft(
          provider,
          dropletMint,
          nftMint,
          null,
          null,
          whitelistProof
        );
      } catch (error) {
        console.log(error);
        throw error;
      }
    });
  });

  it("can redeem NFT from bucket", async () => {
    // Setup: Mint a collection NFT and create bucket
    const collectionCreator = await createKeypair(provider);
    const collectionMint = await mintNft(
      provider,
      collectionCreator,
      collectionCreator.publicKey
    );
    const [dropletMint] = await createBucket(provider, {
      collectionMint,
    });

    // Setup: mint an NFT from that collection
    const nftCreator = await createKeypair(provider);
    const nftMint = await mintNft(
      provider,
      nftCreator,
      provider.wallet.publicKey,
      collectionMint
    );
    await verifyCollection(
      provider,
      nftMint,
      collectionMint,
      collectionCreator
    );

    // Setup: deposit NFT
    await depositNft(provider, dropletMint, nftMint);

    // Redeem NFT
    await redeemNft(provider, dropletMint, nftMint);
  });

  describe("can lock NFT into locker", () => {
    it("for Metaplex v1.1 collections", async () => {
      // Setup: Mint a collection NFT and create bucket
      const collectionCreator = await createKeypair(provider);
      const collectionMint = await mintNft(
        provider,
        collectionCreator,
        collectionCreator.publicKey
      );
      const [dropletMint] = await createBucket(provider, {
        collectionMint,
      });

      // Setup: update bucket params
      await setLockingEnabled(adminProvider, dropletMint, true);
      await updateLockingParams(
        adminProvider,
        dropletMint,
        new anchor.BN(100000),
        10
      );

      // Setup: mint an NFT from that collection and deposit to bucket because bucket can not be empty
      const nftCreator1 = await createKeypair(provider);
      const nftMint1 = await mintNft(
        provider,
        nftCreator1,
        provider.wallet.publicKey,
        collectionMint
      );
      await verifyCollection(
        provider,
        nftMint1,
        collectionMint,
        collectionCreator
      );
      await depositNft(provider, dropletMint, nftMint1);

      // Setup: mint another NFT which is to be locked
      const nftCreator2 = await createKeypair(provider);
      const nftMint2 = await mintNft(
        provider,
        nftCreator2,
        provider.wallet.publicKey,
        collectionMint
      );
      await verifyCollection(
        provider,
        nftMint2,
        collectionMint,
        collectionCreator
      );

      try {
        await lockNft(provider, dropletMint, nftMint2, 100);
      } catch (error) {
        console.log(error);
        throw error;
      }
    });

    it("for Metaplex v1.0 collections", async () => {
      // Setup: Mint 2 NFTs
      const nftCreator1 = await createKeypair(provider);
      const nftMint1 = await mintNft(
        provider,
        nftCreator1,
        provider.wallet.publicKey,
        null,
        true
      );
      const nftCreator2 = await createKeypair(provider);
      const nftMint2 = await mintNft(
        provider,
        nftCreator2,
        provider.wallet.publicKey,
        null,
        true
      );

      const mints = [...Array(5)].map(
        () => new anchor.web3.Keypair().publicKey
      );

      // Setup: Create bucket and update params
      const { root: whitelistRoot } = getMerkleTree([
        ...mints,
        nftMint1,
        nftMint2,
      ]);

      const [dropletMint] = await createBucket(provider, {
        verifiedCreators: [nftCreator1.publicKey, nftCreator2.publicKey],
        symbol: "PCN",
        whitelistRoot,
      });

      // Setup: Enable lockers before depositing
      await setLockingEnabled(adminProvider, dropletMint, true);
      await updateLockingParams(
        adminProvider,
        dropletMint,
        new anchor.BN(100000),
        10
      );

      // Setup: deposit an NFT in bucket because bucket can not be empty
      await depositNft(
        provider,
        dropletMint,
        nftMint1,
        null,
        null,
        getMerkleProof([...mints, nftMint1, nftMint2], nftMint1)
      );

      // Lock NFT
      await lockNft(
        provider,
        dropletMint,
        nftMint2,
        100,
        null,
        null,
        getMerkleProof([...mints, nftMint1, nftMint2], nftMint2)
      );
    });
  });

  it("can unlock NFT from locker", async () => {
    // Setup: Mint a collection NFT and create bucket
    const collectionCreator = await createKeypair(provider);
    const collectionMint = await mintNft(
      provider,
      collectionCreator,
      collectionCreator.publicKey
    );
    const [dropletMint] = await createBucket(provider, {
      collectionMint,
    });

    // Setup: update bucket params
    await setLockingEnabled(adminProvider, dropletMint, true);
    await updateLockingParams(
      adminProvider,
      dropletMint,
      new anchor.BN(100000),
      10
    );

    // Setup: mint an NFT from that collection and deposit to bucket because bucket can not be empty
    const nftCreator1 = await createKeypair(provider);
    const nftMint1 = await mintNft(
      provider,
      nftCreator1,
      provider.wallet.publicKey,
      collectionMint
    );
    await verifyCollection(
      provider,
      nftMint1,
      collectionMint,
      collectionCreator
    );
    await depositNft(provider, dropletMint, nftMint1);

    // Setup: mint another NFT which and lock it
    const nftCreator2 = await createKeypair(provider);
    const nftMint2 = await mintNft(
      provider,
      nftCreator2,
      provider.wallet.publicKey,
      collectionMint
    );
    await verifyCollection(
      provider,
      nftMint2,
      collectionMint,
      collectionCreator
    );
    await lockNft(provider, dropletMint, nftMint2, 100);

    await unlockNft(provider, dropletMint, nftMint2);
  });

  it("can liquidate locker", async () => {
    // Setup: Mint a collection NFT and create bucket
    const collectionCreator = await createKeypair(provider);
    const collectionMint = await mintNft(
      provider,
      collectionCreator,
      collectionCreator.publicKey
    );
    const [dropletMint] = await createBucket(provider, {
      collectionMint,
    });

    // Setup: update bucket params
    await setLockingEnabled(adminProvider, dropletMint, true);
    await updateLockingParams(
      adminProvider,
      dropletMint,
      new anchor.BN(100000),
      10
    );

    // Setup: mint an NFT from that collection and deposit to bucket because bucket can not be empty
    const nftCreator1 = await createKeypair(provider);
    const nftMint1 = await mintNft(
      provider,
      nftCreator1,
      provider.wallet.publicKey,
      collectionMint
    );
    await verifyCollection(
      provider,
      nftMint1,
      collectionMint,
      collectionCreator
    );
    await depositNft(provider, dropletMint, nftMint1);

    // Setup: mint another NFT and lock it
    const nftCreator2 = await createKeypair(provider);
    const nftMint2 = await mintNft(
      provider,
      nftCreator2,
      provider.wallet.publicKey,
      collectionMint
    );
    await verifyCollection(
      provider,
      nftMint2,
      collectionMint,
      collectionCreator
    );
    await lockNft(provider, dropletMint, nftMint2, 1);

    // Sleep for 3 second
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await liquidateLocker(provider, dropletMint, nftMint2);
  });

  describe("can swap one NFT for another", () => {
    it("for Metaplex v1.1 collections", async () => {
      // Setup: Mint a collection NFT and create bucket
      const collectionCreator = await createKeypair(provider);
      const collectionMint = await mintNft(
        provider,
        collectionCreator,
        collectionCreator.publicKey
      );
      const [dropletMint] = await createBucket(provider, {
        collectionMint,
      });

      // Setup: mint an NFT from that collection and deposit into bucket
      const nftCreator1 = await createKeypair(provider);
      const nftMint1 = await mintNft(
        provider,
        nftCreator1,
        provider.wallet.publicKey,
        collectionMint
      );
      await verifyCollection(
        provider,
        nftMint1,
        collectionMint,
        collectionCreator
      );
      await depositNft(provider, dropletMint, nftMint1);

      // Setup: mint another NFT from that collection
      const nftCreator2 = await createKeypair(provider);
      const nftMint2 = await mintNft(
        provider,
        nftCreator2,
        provider.wallet.publicKey,
        collectionMint
      );
      await verifyCollection(
        provider,
        nftMint2,
        collectionMint,
        collectionCreator
      );

      await swapNft(provider, dropletMint, nftMint2, nftMint1);
    });

    it("for Metaplex v1.0 collections", async () => {
      // Setup: Mint 2 NFTs
      const nftCreator1 = await createKeypair(provider);
      const nftMint1 = await mintNft(
        provider,
        nftCreator1,
        provider.wallet.publicKey,
        null,
        true
      );
      const nftCreator2 = await createKeypair(provider);
      const nftMint2 = await mintNft(
        provider,
        nftCreator2,
        provider.wallet.publicKey,
        null,
        true
      );

      const mints = [...Array(5)].map(
        () => new anchor.web3.Keypair().publicKey
      );

      // Setup: Create bucket and deposit an NFT
      const { root: whitelistRoot, tree } = getMerkleTree([
        ...mints,
        nftMint1,
        nftMint2,
      ]);
      const [dropletMint] = await createBucket(provider, {
        verifiedCreators: [nftCreator1.publicKey, nftCreator2.publicKey],
        symbol: "PCN",
        whitelistRoot,
      });
      await depositNft(
        provider,
        dropletMint,
        nftMint1,
        null,
        null,
        getMerkleProof([...mints, nftMint1, nftMint2], nftMint1)
      );

      await swapNft(
        provider,
        dropletMint,
        nftMint2,
        nftMint1,
        null,
        null,
        getMerkleProof([...mints, nftMint1, nftMint2], nftMint2)
      );
    });
  });

  it("can update locking params", async () => {
    // Setup: Mint a collection NFT
    const collectionCreator = await createKeypair(provider);
    const collectionMint = await mintNft(
      provider,
      collectionCreator,
      collectionCreator.publicKey
    );

    // Setup: Create bucket
    const [dropletMint] = await createBucket(provider, {
      collectionMint,
    });

    // Update locking params
    await updateLockingParams(
      adminProvider,
      dropletMint,
      new anchor.BN(10_000),
      100
    );

    // Ensure locking params were updated
    const bucketState = await getBucket(provider.connection, dropletMint);
    expect(bucketState.maxLockerDuration.toNumber()).to.equal(10_000);
    expect(bucketState.interestScaler).to.equal(100);
  });

  it("can enable locking", async () => {
    // Setup: Mint a collection NFT
    const collectionCreator = await createKeypair(provider);
    const collectionMint = await mintNft(
      provider,
      collectionCreator,
      collectionCreator.publicKey
    );

    // Setup: Create bucket
    const [dropletMint] = await createBucket(provider, {
      collectionMint,
    });

    // Update locking params
    await setLockingEnabled(adminProvider, dropletMint, true);

    // Ensure lockers is enabled
    const bucketState = await getBucket(provider.connection, dropletMint);
    expect(bucketState.isLockingEnabled).to.be.true;
  });

  it("can update staking params", async () => {
    // Setup: Create farm
    const bankKeypair = new anchor.web3.Keypair();
    const farmKeypair = new anchor.web3.Keypair();
    const farmManagerKeypair = await createKeypair(provider);
    const rewardAMint = await createMint(
      provider.connection,
      farmManagerKeypair,
      farmManagerKeypair.publicKey,
      null,
      10 ^ 9
    );
    const rewardBMint = await createMint(
      provider.connection,
      farmManagerKeypair,
      farmManagerKeypair.publicKey,
      null,
      10 ^ 9
    );
    await gemFarm.initFarm(
      farmKeypair,
      farmManagerKeypair,
      farmManagerKeypair,
      bankKeypair,
      rewardAMint,
      RewardType.Fixed,
      rewardBMint,
      RewardType.Fixed,
      {
        minStakingPeriodSec: new anchor.BN(0),
        cooldownPeriodSec: new anchor.BN(0),
        unstakingFeeLamp: new anchor.BN(1000000),
      }
    );

    // Setup: Mint a collection NFT
    const collectionCreator = await createKeypair(provider);
    const collectionMint = await mintNft(
      provider,
      collectionCreator,
      collectionCreator.publicKey
    );

    // Setup: Create bucket
    const [dropletMint] = await createBucket(provider, {
      collectionMint,
    });

    // Update staking params
    await updateStakingParams(
      adminProvider,
      dropletMint,
      GEM_BANK_PROG_ID,
      GEM_FARM_PROG_ID,
      farmKeypair.publicKey,
      feeAccount
    );

    // Ensure staking params were updated
    const bucketState = await getBucket(provider.connection, dropletMint);
    expect(bucketState.stakingParams.gembankProgram.toBase58()).to.equal(
      GEM_BANK_PROG_ID.toBase58()
    );
    expect(bucketState.stakingParams.gemfarmProgram.toBase58()).to.equal(
      GEM_FARM_PROG_ID.toBase58()
    );
    expect(bucketState.stakingParams.gemworksFarm.toBase58()).to.equal(
      farmKeypair.publicKey.toBase58()
    );
    expect(bucketState.stakingParams.gemworksFeeAccount.toBase58()).to.equal(
      feeAccount.toBase58()
    );
  });

  it("can enable staking", async () => {
    // Setup: Mint a collection NFT
    const collectionCreator = await createKeypair(provider);
    const collectionMint = await mintNft(
      provider,
      collectionCreator,
      collectionCreator.publicKey
    );

    // Setup: Create bucket
    const [dropletMint] = await createBucket(provider, {
      collectionMint,
    });

    // Update locking params
    await setStakingEnabled(adminProvider, dropletMint, true);

    // Ensure lockers is enabled
    const bucketState = await getBucket(provider.connection, dropletMint);
    expect(bucketState.isStakingEnabled).to.be.true;
  });

  it("can stake NFT to Gem Farm", async () => {
    // Setup: Mint a collection NFT
    const collectionCreator = await createKeypair(provider);
    const collectionMint = await mintNft(
      provider,
      collectionCreator,
      collectionCreator.publicKey
    );

    // Setup: Create farm
    const bankKeypair = new anchor.web3.Keypair();
    const farmKeypair = new anchor.web3.Keypair();
    const farmManagerKeypair = await createKeypair(provider);
    const rewardAMint = await createMint(
      provider.connection,
      farmManagerKeypair,
      farmManagerKeypair.publicKey,
      null,
      10 ^ 9
    );
    const rewardBMint = await createMint(
      provider.connection,
      farmManagerKeypair,
      farmManagerKeypair.publicKey,
      null,
      10 ^ 9
    );
    await gemFarm.initFarm(
      farmKeypair,
      farmManagerKeypair,
      farmManagerKeypair,
      bankKeypair,
      rewardAMint,
      RewardType.Fixed,
      rewardBMint,
      RewardType.Fixed,
      {
        minStakingPeriodSec: new anchor.BN(0),
        cooldownPeriodSec: new anchor.BN(0),
        unstakingFeeLamp: new anchor.BN(1000000),
      }
    );

    // Setup: Create bucket
    const [dropletMint] = await createBucket(provider, {
      collectionMint,
    });

    // Setup: Update staking params
    await updateStakingParams(
      adminProvider,
      dropletMint,
      GEM_BANK_PROG_ID,
      GEM_FARM_PROG_ID,
      farmKeypair.publicKey,
      feeAccount
    );
    await setStakingEnabled(adminProvider, dropletMint, true);

    // Setup: Mint an NFT and deposit to bucket
    const nftCreator = await createKeypair(provider);
    const nftMint = await mintNft(
      provider,
      nftCreator,
      provider.wallet.publicKey,
      collectionMint
    );
    await verifyCollection(
      provider,
      nftMint,
      collectionMint,
      collectionCreator
    );
    await depositNft(provider, dropletMint, nftMint);

    // Stake NFT
    await stakeNft(provider, dropletMint, nftMint);

    // Ensure solvent does not have the NFT anymore
    const solventAuthority = await getSolventAuthority();
    const solventTokenAccount = await getAssociatedTokenAddress(
      nftMint,
      solventAuthority,
      true
    );
    expect(
      (await getAccount(provider.connection, solventTokenAccount)).amount
    ).to.equal(0n);

    const farmerAuthority = await getFarmerAuthority(nftMint);
    const bucketState = await getBucket(provider.connection, dropletMint);

    // Assert farmer account has correct info
    const [farmerAddress] = await findFarmerPDA(
      bucketState.stakingParams.gemworksFarm,
      farmerAuthority
    );
    const farmer = await gemFarm.fetchFarmerAcc(farmerAddress);
    expect(farmer.farm.toBase58()).to.equal(
      bucketState.stakingParams.gemworksFarm.toBase58()
    );
    expect(farmer.identity.toBase58()).to.equal(farmerAuthority.toBase58());
    assert("staked" in farmer.state);
    expect(farmer.gemsStaked.toNumber()).to.equal(1);

    // Assert vault account has correct info
    const vault = await gemBank.fetchVaultAcc(farmer.vault);
    expect(vault.locked).to.be.true;
    expect(vault.gemCount.toNumber()).to.equal(1);
  });

  it("can unstake NFT from Gem Farm", async () => {
    // Setup: Mint a collection NFT
    const collectionCreator = await createKeypair(provider);
    const collectionMint = await mintNft(
      provider,
      collectionCreator,
      collectionCreator.publicKey
    );

    // Setup: Create farm
    const bankKeypair = new anchor.web3.Keypair();
    const farmKeypair = new anchor.web3.Keypair();
    const farmManagerKeypair = await createKeypair(provider);
    const rewardAMint = await createMint(
      provider.connection,
      farmManagerKeypair,
      farmManagerKeypair.publicKey,
      null,
      10 ^ 9
    );
    const rewardBMint = await createMint(
      provider.connection,
      farmManagerKeypair,
      farmManagerKeypair.publicKey,
      null,
      10 ^ 9
    );
    await gemFarm.initFarm(
      farmKeypair,
      farmManagerKeypair,
      farmManagerKeypair,
      bankKeypair,
      rewardAMint,
      RewardType.Fixed,
      rewardBMint,
      RewardType.Fixed,
      {
        minStakingPeriodSec: new anchor.BN(0),
        cooldownPeriodSec: new anchor.BN(0),
        unstakingFeeLamp: new anchor.BN(1000000),
      }
    );

    // Setup: Create bucket
    const [dropletMint] = await createBucket(provider, {
      collectionMint,
    });

    // Setup: Update staking params
    await updateStakingParams(
      adminProvider,
      dropletMint,
      GEM_BANK_PROG_ID,
      GEM_FARM_PROG_ID,
      farmKeypair.publicKey,
      feeAccount
    );
    await setStakingEnabled(adminProvider, dropletMint, true);

    // Setup: Mint an NFT and deposit to bucket
    const nftCreator = await createKeypair(provider);
    const nftMint = await mintNft(
      provider,
      nftCreator,
      provider.wallet.publicKey,
      collectionMint
    );
    await verifyCollection(
      provider,
      nftMint,
      collectionMint,
      collectionCreator
    );
    await depositNft(provider, dropletMint, nftMint);

    // Setup: Stake NFT
    await stakeNft(provider, dropletMint, nftMint);

    // Unstake NFt
    await unstakeNft(provider, dropletMint, nftMint);

    // Ensure solvent has the NFT now
    const solventAuthority = await getSolventAuthority();
    const solventTokenAccount = await getAssociatedTokenAddress(
      nftMint,
      solventAuthority,
      true
    );
    expect(
      (await getAccount(provider.connection, solventTokenAccount)).amount
    ).to.equal(1n);
  });
});
