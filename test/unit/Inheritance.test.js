const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Inheritance Contract", function () {
    let hardhatInheritance;
    let hardhatInheritanceAddress;
    let owner;
    let heir;
    let newHeir;

    const DEPOSIT_AMOUNT = ethers.parseEther('1')
    const WITHDRAW_AMOUNT_ZERO = ethers.parseEther('0')
    const WITHDRAW_AMOUNT_LARGE = ethers.parseEther('2')

    beforeEach(async function () {
        [owner, heir, newHeir] = await ethers.getSigners();
        const Inheritance = await ethers.getContractFactory("Inheritance");
        hardhatInheritance = await Inheritance.deploy(heir.address);
        await hardhatInheritance.waitForDeployment();
        hardhatInheritanceAddress = await hardhatInheritance.getAddress()
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await hardhatInheritance.owner()).to.equal(owner.address);
        });

        it("Should set the correct heir", async function () {
            expect(await hardhatInheritance.heir()).to.equal(heir.address);
        });
    });


    describe("Fallback and Receive", function () {
        it("Should receive ETH", async function () {
            const transactionHash = await owner.sendTransaction({
                to: hardhatInheritanceAddress,
                value: DEPOSIT_AMOUNT
            });
            await transactionHash.wait();

            const contractBalance = await ethers.provider.getBalance(hardhatInheritanceAddress);
            expect(contractBalance.toString()).to.equal(DEPOSIT_AMOUNT.toString());
        });

        it('Should invoke the fallback function', async () => {
            const transactionHash = await owner.sendTransaction({
                to: hardhatInheritanceAddress,
                value: DEPOSIT_AMOUNT,
                data: '0x'
            });
            await transactionHash.wait();

            const contractBalance = await ethers.provider.getBalance(hardhatInheritanceAddress);
            expect(contractBalance.toString()).to.equal(DEPOSIT_AMOUNT.toString());
        });
    });

    describe("Withdrawal and Balances", function () {
        it("Should allow owner to withdraw 0 ETH", async function () {
            // Sending 1 ETH to the contract
            const transactionHash = await owner.sendTransaction({
                to: hardhatInheritanceAddress,
                value: DEPOSIT_AMOUNT,
            });
            await transactionHash.wait();

            const initialBalance = await ethers.provider.getBalance(owner.address);
            const widthrawResponse = await hardhatInheritance.withdraw(WITHDRAW_AMOUNT_ZERO);
            const { fee: withdrawFee } = await widthrawResponse.wait()
            const finalBalance = await ethers.provider.getBalance(owner.address);
            assert.equal(finalBalance.toString(), (initialBalance - withdrawFee).toString()
            )
        });

        it("Should fail if non-owner tries to withdraw", async function () {
            await expect(hardhatInheritance.connect(heir).withdraw(WITHDRAW_AMOUNT_ZERO)).to.be.revertedWithCustomError(hardhatInheritance, "NotOwner");
        });

        it("Should fail if owner tries to withdraw more than contract balance", async function () {
            // Sending 1 ETH to the contract
            const transactionHash = await owner.sendTransaction({
                to: hardhatInheritanceAddress,
                value: DEPOSIT_AMOUNT,
            });
            await transactionHash.wait();

            await expect(hardhatInheritance.connect(owner).withdraw(WITHDRAW_AMOUNT_LARGE)).to.be.revertedWithCustomError(hardhatInheritance, "InsufficientBalance");
        });
    });

    describe("Heir Control", function () {
        it("Should not allow heir to take control before 30 days of inactivity", async function () {
            await expect(hardhatInheritance.connect(heir).takeControl(newHeir.address)).to.be.revertedWithCustomError(hardhatInheritance, "OwnerNotExpired");
        });

        it("Should not allow anyone other than heir to take control", async function () {
            await expect(hardhatInheritance.connect(owner).takeControl(newHeir.address)).to.be.revertedWithCustomError(hardhatInheritance, "NotHeir");
        });

        it("should allow heir to take control after 30 days of inactivity", async function () {
            await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60 + 1]); // Increase time by 30 days and 1 second
            await ethers.provider.send("evm_mine"); // mine the next block
            await hardhatInheritance.connect(heir).takeControl(newHeir.address);
            expect(await hardhatInheritance.owner()).to.equal(heir.address);
            expect(await hardhatInheritance.heir()).to.equal(newHeir.address);
        });
    });


});