import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';

const nameToken = 'MRIToken';
const symbolToken = 'MRI';

describe('Grindery Offer testings', function () {
  const chainId = 31337;

  let owner: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    user3: SignerWithAddress,
    user4: SignerWithAddress,
    minter: SignerWithAddress,
    grtPool: Contract,
    grtTestToken: Contract,
    token: Contract,
    offerId: string,
    tradeId: string;

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, minter] = await ethers.getSigners();

    upgrades.silenceWarnings();

    grtTestToken = await upgrades.deployProxy(
      await ethers.getContractFactory(
        'contracts/v2/GrtMRIToken.sol:GrtMRIToken'
      ),
      [nameToken, symbolToken, minter.address]
    );

    grtPool = await upgrades.deployProxy(
      await ethers.getContractFactory(`contracts/v2/GrtPool.sol:GrtPoolV2`),
      [grtTestToken.address]
    );
    await grtPool.deployed();

    token = await (await ethers.getContractFactory('ERC20Sample')).deploy();
    await token.deployed();
  });

  describe('Initialization', function () {
    it('Should set the proper owner', async function () {
      expect(await grtPool.owner()).to.equal(owner.address);
    });
  });

  describe('Set Test Token address', function () {
    it('Should fail if the called is not the owner', async function () {
      await expect(
        grtPool.connect(user3).setMRIToken(token.address)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should modify the Test Token address', async function () {
      await grtPool.connect(owner).setMRIToken(token.address);
      expect(await grtPool.getMRIToken()).to.equal(token.address);
    });
  });

  describe('Native tokens', function () {
    describe('Deposit ETH and accept an offer', function () {
      beforeEach(async function () {
        offerId = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['address', 'uint256', 'uint256'],
            [user1.address, 0, chainId]
          )
        );

        tradeId = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['address', 'uint256', 'uint256'],
            [user2.address, 0, chainId]
          )
        );
        await grtPool
          .connect(user1)
          .setOffer(
            token.address,
            chainId,
            ethers.utils.defaultAbiCoder.encode(
              ['string', 'string'],
              ['FIRA', '100']
            ),
            ethers.utils.defaultAbiCoder.encode(
              ['string', 'string'],
              ['FIRA', '1000']
            )
          );
      });

      it('Should fail if the deposit amount is 0', async function () {
        await grtPool.connect(user1).setIsActiveOffer(offerId, false);
        await expect(
          grtPool
            .connect(user3)
            .depositNativeAndAcceptOffer(offerId, user3.address, 10, {
              value: 0,
            })
        ).to.be.revertedWith(
          'Grindery Pool: transfered amount must be positive.'
        );
      });

      it('Should fail if the offer is inactive', async function () {
        await grtPool.connect(user1).setIsActiveOffer(offerId, false);
        await expect(
          grtPool
            .connect(user3)
            .depositNativeAndAcceptOffer(offerId, user3.address, 10, {
              value: 100,
            })
        ).to.be.revertedWith('Grindery Pool: the offer is inactive.');
      });

      it('Should fail if the destination address is the zero address', async function () {
        await grtPool.connect(user1).setIsActiveOffer(offerId, false);
        await expect(
          grtPool
            .connect(user3)
            .depositNativeAndAcceptOffer(
              offerId,
              ethers.constants.AddressZero,
              10,
              {
                value: 100,
              }
            )
        ).to.be.revertedWith(
          'Grindery Pool: zero address as destination address is not allowed.'
        );
      });

      it('Should decrease the native token balance of the user', async function () {
        let expectedBalance = await ethers.provider.getBalance(user2.address);
        const tx = await (
          await grtPool
            .connect(user2)
            .depositNativeAndAcceptOffer(offerId, user2.address, 10, {
              value: 250,
            })
        ).wait();
        expectedBalance = expectedBalance.sub(
          tx.gasUsed.mul(tx.effectiveGasPrice)
        );
        expectedBalance = expectedBalance.sub(ethers.BigNumber.from(250));
        expect(await ethers.provider.getBalance(user2.address)).to.equal(
          expectedBalance
        );
      });

      it('Should increase the native token balance of the pool contract', async function () {
        let expectedBalance = await ethers.provider.getBalance(grtPool.address);
        await (
          await grtPool
            .connect(user2)
            .depositNativeAndAcceptOffer(offerId, user2.address, 10, {
              value: 250,
            })
        ).wait();
        expectedBalance = expectedBalance.add(ethers.BigNumber.from(250));
        expect(await ethers.provider.getBalance(grtPool.address)).to.equal(
          expectedBalance
        );
      });

      it('Should emit a new trade event', async function () {
        await expect(
          await grtPool
            .connect(user2)
            .depositNativeAndAcceptOffer(offerId, user2.address, 10, {
              value: 100,
            })
        )
          .to.emit(grtPool, 'LogNewTrade')
          .withArgs(
            user1.address,
            tradeId,
            ethers.constants.AddressZero,
            100,
            offerId
          );
      });

      it('Should emit new trade event with TradeId different for each call', async function () {
        await (
          await grtPool
            .connect(user2)
            .depositNativeAndAcceptOffer(offerId, user2.address, 10, {
              value: 100,
            })
        ).wait();

        await (
          await grtPool
            .connect(user2)
            .depositNativeAndAcceptOffer(offerId, user2.address, 10, {
              value: 100,
            })
        ).wait();
        await expect(
          await grtPool
            .connect(user2)
            .depositNativeAndAcceptOffer(offerId, user2.address, 10, {
              value: 100,
            })
        )
          .to.emit(grtPool, 'LogNewTrade')
          .withArgs(
            user1.address,
            ethers.utils.keccak256(
              ethers.utils.solidityPack(
                ['address', 'uint256', 'uint256'],
                [user2.address, 2, chainId]
              )
            ),
            ethers.constants.AddressZero,
            100,
            offerId
          );
      });

      it('Should set the deposit user', async function () {
        await grtPool
          .connect(user2)
          .depositNativeAndAcceptOffer(offerId, user2.address, 10, {
            value: 100,
          });
        expect(await grtPool.getBuyerTrade(tradeId)).to.equal(user2.address);
      });

      it('Should set the destination address', async function () {
        await grtPool
          .connect(user2)
          .depositNativeAndAcceptOffer(offerId, user4.address, 10, {
            value: 100,
          });
        expect(await grtPool.getDestinationAddressTrade(tradeId)).to.equal(
          user4.address
        );
      });

      it('Should set the zero address for the native token deposit', async function () {
        await grtPool
          .connect(user2)
          .depositNativeAndAcceptOffer(offerId, user4.address, 10, {
            value: 100,
          });
        expect(await grtPool.getDepositTokenTrade(tradeId)).to.equal(
          ethers.constants.AddressZero
        );
      });

      it('Should set the proper amount for the native token deposit', async function () {
        await grtPool
          .connect(user2)
          .depositNativeAndAcceptOffer(offerId, user4.address, 10, {
            value: 100,
          });
        expect(await grtPool.getDepositAmountTrade(tradeId)).to.equal(100);
      });

      it('Should set the offer amount', async function () {
        await grtPool
          .connect(user2)
          .depositNativeAndAcceptOffer(offerId, user4.address, 10, {
            value: 100,
          });
        expect(await grtPool.getAmountOfferForTrade(tradeId)).to.equal(10);
      });

      it('Should set the chainId for the deposit', async function () {
        await grtPool
          .connect(user2)
          .depositNativeAndAcceptOffer(offerId, user4.address, 10, {
            value: 100,
          });
        expect(await grtPool.getDepositChainIdTrade(tradeId)).to.equal(chainId);
      });

      it('Should get the offerId', async function () {
        await grtPool
          .connect(user2)
          .depositNativeAndAcceptOffer(offerId, user4.address, 10, {
            value: 100,
          });
        expect(await grtPool.getOfferIdForTrade(tradeId)).to.equal(offerId);
      });

      it('Should increase the deposit nonce of the user by 1', async function () {
        await grtPool
          .connect(user2)
          .depositNativeAndAcceptOffer(offerId, user4.address, 10, {
            value: 100,
          });
        await grtPool
          .connect(user2)
          .depositNativeAndAcceptOffer(offerId, user4.address, 10, {
            value: 100,
          });
        expect(await grtPool.getNonceUserTrade(user2.address)).to.equal(2);
      });
    });

    describe('Withdraw Native tokens from pool', function () {
      beforeEach(async function () {
        offerId = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['address', 'uint256', 'uint256'],
            [user1.address, 0, chainId]
          )
        );
        await grtPool
          .connect(user1)
          .setOffer(
            token.address,
            chainId,
            ethers.utils.defaultAbiCoder.encode(
              ['string', 'string'],
              ['FIRA', '100']
            ),
            ethers.utils.defaultAbiCoder.encode(
              ['string', 'string'],
              ['FIRA', '1000']
            )
          );
        await grtPool
          .connect(user3)
          .depositNativeAndAcceptOffer(offerId, user3.address, 10, {
            value: 2,
          });
      });

      it('Should fail if msg.sender is not the Owner', async function () {
        await expect(
          grtPool.connect(user3).withdrawNative(1, user4.address)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should fail if the required amount is higher than the contract balance', async function () {
        await expect(
          grtPool.connect(owner).withdrawNative(10, user4.address)
        ).to.be.revertedWith('Grindery Pool: insufficient balance.');
      });

      it('Should decrease the contract balance', async function () {
        await grtPool.connect(owner).withdrawNative(1, user4.address);
        expect(await ethers.provider.getBalance(grtPool.address)).to.equal(
          2 - 1
        );
      });

      it('Should increase the balance of the recipient', async function () {
        let expectedBalance = await ethers.provider.getBalance(user4.address);
        await (
          await grtPool.connect(owner).withdrawNative(1, user4.address)
        ).wait();
        expectedBalance = expectedBalance.add(ethers.BigNumber.from(1));
        expect(await ethers.provider.getBalance(user4.address)).to.equal(
          expectedBalance
        );
      });
    });
  });

  describe('Test tokens', function () {
    describe('Deposit Test tokens and accept an offer', function () {
      beforeEach(async function () {
        await grtTestToken.connect(minter).mint(user2.address, 5000);
        await grtTestToken.connect(user2).approve(grtPool.address, 500);

        offerId = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['address', 'uint256', 'uint256'],
            [user1.address, 0, chainId]
          )
        );

        tradeId = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['address', 'uint256', 'uint256'],
            [user2.address, 0, chainId]
          )
        );
        await grtPool
          .connect(user1)
          .setOffer(
            token.address,
            chainId,
            ethers.utils.defaultAbiCoder.encode(
              ['string', 'string'],
              ['FIRA', '100']
            ),
            ethers.utils.defaultAbiCoder.encode(
              ['string', 'string'],
              ['FIRA', '1000']
            )
          );
      });

      it('Should fail if the token address is the zero address', async function () {
        await expect(
          grtPool
            .connect(user3)
            .depositMRITokenAndAcceptOffer(
              ethers.constants.AddressZero,
              5,
              offerId,
              user3.address,
              10
            )
        ).to.be.revertedWith(
          'Grindery Pool: the token must not be zero address.'
        );
      });

      it('Should fail if the token address is not _tokenMRI', async function () {
        await expect(
          grtPool
            .connect(user3)
            .depositMRITokenAndAcceptOffer(
              token.address,
              5,
              offerId,
              user3.address,
              10
            )
        ).to.be.revertedWith(
          'Grindery Pool: the token sent must be the test token.'
        );
      });

      it('Should fail if the deposit amount is 0', async function () {
        await expect(
          grtPool
            .connect(user3)
            .depositMRITokenAndAcceptOffer(
              grtTestToken.address,
              0,
              offerId,
              user3.address,
              10
            )
        ).to.be.revertedWith(
          'Grindery Pool: transfered amount must be positive.'
        );
      });

      it('Should fail if the offer is inactive', async function () {
        await grtPool.connect(user1).setIsActiveOffer(offerId, false);
        await expect(
          grtPool
            .connect(user3)
            .depositMRITokenAndAcceptOffer(
              grtTestToken.address,
              100,
              offerId,
              user3.address,
              10
            )
        ).to.be.revertedWith('Grindery Pool: the offer is inactive.');
      });

      it('Should fail if the destination address is the zero address', async function () {
        await grtPool.connect(user1).setIsActiveOffer(offerId, false);
        await expect(
          grtPool
            .connect(user3)
            .depositMRITokenAndAcceptOffer(
              grtTestToken.address,
              100,
              offerId,
              ethers.constants.AddressZero,
              10
            )
        ).to.be.revertedWith(
          'Grindery Pool: zero address as destination address is not allowed.'
        );
      });

      it('Should decrease the native token balance of the user', async function () {
        const expectedBalance = await grtTestToken.balanceOf(user2.address);
        await grtPool
          .connect(user2)
          .depositMRITokenAndAcceptOffer(
            grtTestToken.address,
            250,
            offerId,
            user2.address,
            10
          );
        expect(await grtTestToken.balanceOf(user2.address)).to.equal(
          expectedBalance - 250
        );
      });

      it('Should increase the token balance of the pool contract', async function () {
        const expectedBalance = await grtTestToken.balanceOf(grtPool.address);

        await grtPool
          .connect(user2)
          .depositMRITokenAndAcceptOffer(
            grtTestToken.address,
            250,
            offerId,
            user2.address,
            10
          );

        expect(await grtTestToken.balanceOf(grtPool.address)).to.equal(
          expectedBalance + 250
        );
      });

      it('Should emit a new trade event', async function () {
        await expect(
          await grtPool
            .connect(user2)
            .depositMRITokenAndAcceptOffer(
              grtTestToken.address,
              250,
              offerId,
              user2.address,
              10
            )
        )
          .to.emit(grtPool, 'LogNewTrade')
          .withArgs(user1.address, tradeId, grtTestToken.address, 250, offerId);
      });

      it('Should emit new trade event with TradeId different for each call', async function () {
        await (
          await grtPool
            .connect(user2)
            .depositMRITokenAndAcceptOffer(
              grtTestToken.address,
              100,
              offerId,
              user2.address,
              10
            )
        ).wait();

        await (
          await grtPool
            .connect(user2)
            .depositMRITokenAndAcceptOffer(
              grtTestToken.address,
              100,
              offerId,
              user2.address,
              10
            )
        ).wait();

        await expect(
          await grtPool
            .connect(user2)
            .depositMRITokenAndAcceptOffer(
              grtTestToken.address,
              100,
              offerId,
              user2.address,
              10
            )
        )
          .to.emit(grtPool, 'LogNewTrade')
          .withArgs(
            user1.address,
            ethers.utils.keccak256(
              ethers.utils.solidityPack(
                ['address', 'uint256', 'uint256'],
                [user2.address, 2, chainId]
              )
            ),
            grtTestToken.address,
            100,
            offerId
          );
      });

      it('Should set the deposit user', async function () {
        await grtPool
          .connect(user2)
          .depositMRITokenAndAcceptOffer(
            grtTestToken.address,
            100,
            offerId,
            user2.address,
            10
          );
        expect(await grtPool.getBuyerTrade(tradeId)).to.equal(user2.address);
      });

      it('Should set the destination address', async function () {
        await grtPool
          .connect(user2)
          .depositMRITokenAndAcceptOffer(
            grtTestToken.address,
            100,
            offerId,
            user4.address,
            10
          );
        expect(await grtPool.getDestinationAddressTrade(tradeId)).to.equal(
          user4.address
        );
      });

      it('Should set the TEST token address for the deposit', async function () {
        await grtPool
          .connect(user2)
          .depositMRITokenAndAcceptOffer(
            grtTestToken.address,
            100,
            offerId,
            user2.address,
            10
          );
        expect(await grtPool.getDepositTokenTrade(tradeId)).to.equal(
          grtTestToken.address
        );
      });

      it('Should set the TEST amount for the deposit', async function () {
        await grtPool
          .connect(user2)
          .depositMRITokenAndAcceptOffer(
            grtTestToken.address,
            100,
            offerId,
            user2.address,
            10
          );
        expect(await grtPool.getDepositAmountTrade(tradeId)).to.equal(100);
      });

      it('Should set the offer amount', async function () {
        await grtPool
          .connect(user2)
          .depositMRITokenAndAcceptOffer(
            grtTestToken.address,
            100,
            offerId,
            user2.address,
            10
          );
        expect(await grtPool.getAmountOfferForTrade(tradeId)).to.equal(10);
      });

      it('Should set the chainId for the deposit', async function () {
        await grtPool
          .connect(user2)
          .depositMRITokenAndAcceptOffer(
            grtTestToken.address,
            100,
            offerId,
            user2.address,
            10
          );
        expect(await grtPool.getDepositChainIdTrade(tradeId)).to.equal(chainId);
      });

      it('Should set the offerId', async function () {
        await grtPool
          .connect(user2)
          .depositMRITokenAndAcceptOffer(
            grtTestToken.address,
            100,
            offerId,
            user2.address,
            10
          );
        expect(await grtPool.getOfferIdForTrade(tradeId)).to.equal(offerId);
      });

      it('Should increase the deposit nonce of the user by 1', async function () {
        await grtPool
          .connect(user2)
          .depositMRITokenAndAcceptOffer(
            grtTestToken.address,
            100,
            offerId,
            user2.address,
            10
          );
        await grtPool
          .connect(user2)
          .depositMRITokenAndAcceptOffer(
            grtTestToken.address,
            100,
            offerId,
            user2.address,
            10
          );
        expect(await grtPool.getNonceUserTrade(user2.address)).to.equal(2);
      });
    });

    describe('Withdraw tokens from pool', function () {
      beforeEach(async function () {
        await grtTestToken.connect(minter).mint(user3.address, 5000);
        await grtTestToken.connect(user3).approve(grtPool.address, 500);

        offerId = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['address', 'uint256', 'uint256'],
            [user1.address, 0, chainId]
          )
        );
        await grtPool
          .connect(user1)
          .setOffer(
            token.address,
            chainId,
            ethers.utils.defaultAbiCoder.encode(
              ['string', 'string'],
              ['FIRA', '100']
            ),
            ethers.utils.defaultAbiCoder.encode(
              ['string', 'string'],
              ['FIRA', '1000']
            )
          );
        await grtPool
          .connect(user3)
          .depositMRITokenAndAcceptOffer(
            grtTestToken.address,
            100,
            offerId,
            user2.address,
            10
          );
      });

      it('Should fail if msg.sender is not the Owner', async function () {
        await expect(
          grtPool
            .connect(user3)
            .withdrawERC20Tokens(grtTestToken.address, 10, user4.address)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should fail if the required amount is higher than the contract balance', async function () {
        await expect(
          grtPool
            .connect(owner)
            .withdrawERC20Tokens(grtTestToken.address, 10000, user4.address)
        ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
      });

      it('Should decrease the contract balance', async function () {
        await grtPool
          .connect(owner)
          .withdrawERC20Tokens(grtTestToken.address, 10, user4.address);
        expect(await grtTestToken.balanceOf(grtPool.address)).to.equal(
          100 - 10
        );
      });

      it('Should increase the balance of the destination user', async function () {
        const expectedBalance = await grtTestToken.balanceOf(user4.address);
        await grtPool
          .connect(owner)
          .withdrawERC20Tokens(grtTestToken.address, 10, user4.address);
        expect(await grtTestToken.balanceOf(user4.address)).to.equal(
          expectedBalance + 10
        );
      });
    });
  });

  describe('Function to return payment information - Zapier use case', function () {
    beforeEach(async function () {
      offerId = ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ['address', 'uint256', 'uint256'],
          [user1.address, 0, chainId]
        )
      );
      tradeId = ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ['address', 'uint256', 'uint256'],
          [user3.address, 0, chainId]
        )
      );
      await grtPool
        .connect(user1)
        .setOffer(
          token.address,
          chainId,
          ethers.utils.defaultAbiCoder.encode(
            ['string', 'string'],
            ['FIRA', '100']
          ),
          ethers.utils.defaultAbiCoder.encode(
            ['string', 'string'],
            ['FIRA', '1000']
          )
        );
      await grtPool
        .connect(user3)
        .depositNativeAndAcceptOffer(offerId, user3.address, 10, {
          value: 2,
        });
    });

    it('Should return all the payment information', async function () {
      const res = await grtPool.getPaymentInfoTrade(tradeId);

      expect(res.offerId).to.equal(offerId);
      expect(res.destAddress).to.equal(user3.address);
      expect(res.token).to.equal(token.address);
      expect(res.amount).to.equal(10);
    });
  });

  describe('Set an order as complete', function () {
    beforeEach(async function () {
      offerId = ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ['address', 'uint256', 'uint256'],
          [user1.address, 0, chainId]
        )
      );
      await grtPool
        .connect(user1)
        .setOffer(
          token.address,
          chainId,
          ethers.utils.defaultAbiCoder.encode(
            ['string', 'string'],
            ['FIRA', '100']
          ),
          ethers.utils.defaultAbiCoder.encode(
            ['string', 'string'],
            ['FIRA', '1000']
          )
        );

      tradeId = ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ['address', 'uint256', 'uint256'],
          [user3.address, 0, chainId]
        )
      );
      await grtPool
        .connect(user3)
        .depositNativeAndAcceptOffer(offerId, user3.address, 10, {
          value: 2,
        });
    });

    it('Should fail if the msg.sender is not the order creator', async function () {
      await expect(
        grtPool.connect(user1).setCompleteTrade(tradeId)
      ).to.be.revertedWith(
        'Grindery Pool: you are not the user who made the order.'
      );
    });

    it('Should fail if order is already complete', async function () {
      await grtPool.connect(user3).setCompleteTrade(tradeId);
      await expect(
        grtPool.connect(user3).setCompleteTrade(tradeId)
      ).to.be.revertedWith('Grindery Pool: the order is already complete.');
    });

    it('Should set the order as complete', async function () {
      await grtPool.connect(user3).setCompleteTrade(tradeId);
      expect(await grtPool.isCompleteTrade(tradeId)).to.be.true;
    });
  });
});
