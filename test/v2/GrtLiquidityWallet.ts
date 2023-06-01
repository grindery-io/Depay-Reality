import { ethers, upgrades } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract, BigNumber } from 'ethers';

describe('Grindery Liquidity Wallet', () => {
  let owner: SignerWithAddress,
    user2: SignerWithAddress,
    bot: SignerWithAddress,
    bot2: SignerWithAddress,
    grtToken: Contract,
    token: Contract,
    grtLiquidityWallet: Contract,
    offerId: string,
    tradeId: string;

  beforeEach(async () => {
    [owner, user2, bot, bot2] = await ethers.getSigners();

    grtToken = await (await ethers.getContractFactory('ERC20Sample')).deploy();
    await grtToken.deployed();

    token = await (await ethers.getContractFactory('ERC20Sample')).deploy();
    await token.deployed();

    grtLiquidityWallet = await upgrades.deployProxy(
      await ethers.getContractFactory(
        'contracts/v2/GrtLiquidityWallet.sol:GrtLiquidityWalletV2'
      ),
      [bot.address]
    );
    await grtLiquidityWallet.deployed();
    await grtToken.connect(owner).mint(owner.address, 1000);
    offerId =
      '0xd2b8dbec86dba5f9b5c34f84d0dc19bf715f984e3c78051e5ffa813a1d29dd73';
    tradeId =
      '0x7eed0db68dde2d383b9450597aa4a76fa97360cb705f21e5166d8f034c1f42ec';
  });

  describe('Initialization', async () => {
    it('Should set the proper owner', async function () {
      expect(await grtLiquidityWallet.owner()).to.equal(owner.address);
    });

    it('Should set the proper bot address', async function () {
      expect(await grtLiquidityWallet.getBot()).to.equal(bot.address);
    });
  });

  describe('Transfer tokens to Liquidity Wallet', async () => {
    describe('Transfer native tokens to Liquidity Wallet', async () => {
      it('Should increase liquidity wallet native tokens balance', async () => {
        await (
          await user2.sendTransaction({
            to: grtLiquidityWallet.address,
            value: 100,
          })
        ).wait();
        expect(
          await ethers.provider.getBalance(grtLiquidityWallet.address)
        ).to.equal(100);
      });

      it('Should decrease sender native tokens balance', async () => {
        let expectedBalance = await ethers.provider.getBalance(user2.address);
        const tx = await (
          await user2.sendTransaction({
            to: grtLiquidityWallet.address,
            value: 100,
          })
        ).wait();

        expectedBalance = expectedBalance.sub(
          tx.gasUsed.mul(tx.effectiveGasPrice)
        );
        expectedBalance = expectedBalance.sub(ethers.BigNumber.from(100));

        expect(await ethers.provider.getBalance(user2.address)).to.equal(
          expectedBalance
        );
      });
    });

    describe('Transfer ERC20 tokens to Liquidity Wallet', async () => {
      it('Should increase the balance of the liquidity wallet contract', async () => {
        await token.connect(user2).mint(user2.address, 40000);
        await token.connect(user2).transfer(grtLiquidityWallet.address, 100);
        expect(await token.balanceOf(grtLiquidityWallet.address)).to.equal(100);
      });

      it('Should decrease the balance of the user', async () => {
        await token.connect(user2).mint(user2.address, 40000);
        await token.connect(user2).transfer(grtLiquidityWallet.address, 100);
        expect(await token.balanceOf(user2.address)).to.equal(40000 - 100);
      });
    });
  });

  describe('Set bot address', async () => {
    it('Non owner should not be able to set bot address', async () => {
      await expect(
        grtLiquidityWallet.connect(user2).setBot(bot.address)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Owner should be able to update bot address', async () => {
      await grtLiquidityWallet.connect(owner).setBot(bot2.address);
      expect(await grtLiquidityWallet.connect(owner).getBot()).to.equal(
        bot2.address
      );
    });
  });

  describe('Withdraw ERC20 funds from Liquidity Wallet', async () => {
    it('Non owner are not allowed to withdraw', async () => {
      await grtToken.connect(owner).transfer(grtLiquidityWallet.address, 100);
      await expect(
        grtLiquidityWallet.connect(user2).withdrawERC20(grtToken.address, 100)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should decrease the ERC20 balance of the liquidity wallet contract', async () => {
      await grtToken.connect(owner).transfer(grtLiquidityWallet.address, 300);
      const status = await grtLiquidityWallet
        .connect(owner)
        .withdrawERC20(grtToken.address, 100);
      expect(
        await grtToken.connect(owner).balanceOf(grtLiquidityWallet.address)
      ).to.equal(300 - 100);
      expect(Boolean(status)).to.be.true;
    });

    it('Should increase the ERC20 balance of the user', async () => {
      const expectedBalance = await grtToken
        .connect(owner)
        .balanceOf(owner.address);
      await grtToken.connect(owner).transfer(grtLiquidityWallet.address, 300);
      const status = await grtLiquidityWallet
        .connect(owner)
        .withdrawERC20(grtToken.address, 100);
      expect(await grtToken.connect(owner).balanceOf(owner.address)).to.equal(
        expectedBalance - 300 + 100
      );
      expect(Boolean(status)).to.be.true;
    });
  });

  describe('Withdraw Native funds from Liquidity Wallet', async () => {
    it('Non owner are not allowed to withdraw', async () => {
      await (
        await user2.sendTransaction({
          to: grtLiquidityWallet.address,
          value: ethers.utils.parseEther('100'),
        })
      ).wait();
      await expect(
        grtLiquidityWallet
          .connect(user2)
          .withdrawNative(ethers.utils.parseEther('100'))
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should withdraw Native funds', async () => {
      await (
        await user2.sendTransaction({
          to: grtLiquidityWallet.address,
          value: ethers.utils.parseEther('100'),
        })
      ).wait();
      const status = await grtLiquidityWallet
        .connect(owner)
        .withdrawNative(ethers.utils.parseEther('100'));
      expect(Boolean(status)).to.be.true;
    });

    it('Should increase the native token balance of the owner', async () => {
      let expectedBalance = await ethers.provider.getBalance(owner.address);
      const tx = await (
        await owner.sendTransaction({
          to: grtLiquidityWallet.address,
          value: 400,
        })
      ).wait();
      expectedBalance = expectedBalance.sub(
        tx.gasUsed.mul(tx.effectiveGasPrice)
      );
      expectedBalance = expectedBalance.sub(ethers.BigNumber.from(400));
      const withdraw = await (
        await grtLiquidityWallet.connect(owner).withdrawNative(100)
      ).wait();
      expectedBalance = expectedBalance.sub(
        withdraw.gasUsed.mul(withdraw.effectiveGasPrice)
      );
      expectedBalance = expectedBalance.add(ethers.BigNumber.from(100));
      expect(await ethers.provider.getBalance(owner.address)).to.equal(
        expectedBalance
      );
    });

    it('Should decrease the native token balance of the wallet contract', async () => {
      let expectedBalance = await ethers.provider.getBalance(
        grtLiquidityWallet.address
      );
      await (
        await owner.sendTransaction({
          to: grtLiquidityWallet.address,
          value: 400,
        })
      ).wait();
      expectedBalance = expectedBalance.add(ethers.BigNumber.from(400));

      await (
        await grtLiquidityWallet.connect(owner).withdrawNative(100)
      ).wait();
      expectedBalance = expectedBalance.sub(ethers.BigNumber.from(100));
      expect(
        await ethers.provider.getBalance(grtLiquidityWallet.address)
      ).to.equal(expectedBalance);
    });

    it('Should fail if balance is less than given amount', async () => {
      await (
        await user2.sendTransaction({
          to: grtLiquidityWallet.address,
          value: ethers.utils.parseEther('100'),
        })
      ).wait();
      await expect(
        grtLiquidityWallet
          .connect(owner)
          .withdrawNative(ethers.utils.parseEther('200'))
      ).to.be.revertedWith('Grindery wallet: insufficient balance.');
    });
  });

  describe('Pay ERC20 offer', async () => {
    it('Non owner nor bot should not be able to pay ERC20 offer', async () => {
      await expect(
        grtLiquidityWallet
          .connect(user2)
          .payTradeWithERC20Tokens(
            offerId,
            tradeId,
            grtToken.address,
            owner.address,
            100
          )
      ).to.be.revertedWith('Grindery wallet: not allowed to pay the trade.');
    });

    it('Should transfer ERC20 funds to user', async () => {
      await grtToken.connect(owner).transfer(grtLiquidityWallet.address, 100);
      const status = await grtLiquidityWallet
        .connect(owner)
        .payTradeWithERC20Tokens(
          offerId,
          tradeId,
          grtToken.address,
          user2.address,
          100
        );

      expect(
        (await grtToken.connect(user2).balanceOf(user2.address)).toString()
      ).to.equal('100');
      expect(Boolean(status)).to.be.true;
    });

    it('Should emit a LogTradePaid event', async () => {
      await grtToken.connect(owner).transfer(grtLiquidityWallet.address, 100);
      await expect(
        await grtLiquidityWallet
          .connect(owner)
          .payTradeWithERC20Tokens(
            offerId,
            tradeId,
            grtToken.address,
            user2.address,
            100
          )
      )
        .to.emit(grtLiquidityWallet, 'LogTradePaid')
        .withArgs(offerId, tradeId, grtToken.address, user2.address, 100);
    });
  });

  describe('Pay Native offer', async () => {
    it('Non owner nor bot should not be able to pay Native offer', async () => {
      await expect(
        grtLiquidityWallet
          .connect(user2)
          .payTradeWithNativeTokens(offerId, tradeId, owner.address, 100)
      ).to.be.revertedWith('Grindery wallet: not allowed to pay the trade.');
    });

    it('Should transfer Native funds to user', async () => {
      const balanceBefore = await user2.getBalance();
      await (
        await owner.sendTransaction({
          to: grtLiquidityWallet.address,
          value: 100,
        })
      ).wait();
      const status = await grtLiquidityWallet
        .connect(owner)
        .payTradeWithNativeTokens(offerId, tradeId, user2.address, 100);
      const balanceAfter = await user2.getBalance();

      expect(balanceAfter).to.equal(balanceBefore.add(BigNumber.from('100')));
      expect(Boolean(status)).to.be.true;
    });

    it('Should emit a LogTradePaid event', async () => {
      await (
        await owner.sendTransaction({
          to: grtLiquidityWallet.address,
          value: 100,
        })
      ).wait();
      await expect(
        await grtLiquidityWallet
          .connect(owner)
          .payTradeWithNativeTokens(offerId, tradeId, user2.address, 100)
      )
        .to.emit(grtLiquidityWallet, 'LogTradePaid')
        .withArgs(
          offerId,
          tradeId,
          ethers.constants.AddressZero,
          user2.address,
          100
        );
    });
  });
});
