
const CourseMarketplace = artifacts.require("CourseMarketplace")
const { catchRevert } = require("./utils/exceptions")
//Mocha - testing framework
//Chai - assertion JS library 

contract("CourseMarketplace", accounts => {

    const courseId = "0x00000000000000000000000000003130";
    const proof = "0x0000000000000000000000000000313000000000000000000000000000003130";

    const courseId2 = "0x00000000000000000000000000002130";
    const proof2 = "0x0000000000000000000000000000213000000000000000000000000000002130";
    const value = "900000000";

    let _contract = null
    let contractOwner = null
    let buyer = null
    let courseHash = null

    before(async () => {
        _contract = await CourseMarketplace.deployed()
        contractOwner = accounts[0]
        buyer = accounts[1]

        console.log(contractOwner)
        console.log(buyer)
    })

    describe("Purchase the new course", () => {

        before(async () => {
            await _contract.purchaseCourse(courseId, proof, {
                from: buyer,
                value
            })
        })

        it("can get the purchased course hash by index", async () => {
            const index = 0;
            courseHash = await _contract.getCourseHashAtIndex(index)

            const expectedHash = web3.utils.soliditySha3(
                { type: "bytes16", value: courseId },
                { type: "address", value: buyer }
            )

            assert.equal(courseHash, expectedHash, "matching")
        })

        it("should match the purchased data", async () => {
            const expectedIndex = 0
            const expectedState = 0

            const course = await _contract.getCourseByHash(courseHash)

            assert.equal(course.id, expectedIndex, "Course index should be 0!")
            assert.equal(course.price, value, `Course price  should be ${value}`)
            assert.equal(course.proof, proof, `Course proof should be ${proof}`)
            assert.equal(course.id, expectedIndex, "Course index should be 0!")
        })
    })

    describe("Actived Course!", () => {
        before(async () => {
            await _contract.activeCourse(courseHash, { from: contractOwner })
        })

        it("should have ACTIVED State", async () => {
            const course = await _contract.getCourseByHash(courseHash)

            const expectedState = 1
            assert.equal(course.state, expectedState, "Course should be have actived state")
        })
    })

    describe("Deactivate course", () => {
        let courseHash2 = null;
        before(async () => {
            await _contract.purchaseCourse(courseId2, proof2, { from: buyer, value })
            courseHash2 = await _contract.getCourseHashAtIndex(1)
        })

        it("should not be able to deactivate the course by Not contract owner", async () => {
            await catchRevert(_contract.deactiveCourse(courseHash2, { from: buyer }))
        })

        it("should have status of deactivated and price 0", async () => {
            await _contract.deactiveCourse(courseHash2, { from: contractOwner })

            const course = await _contract.getCourseByHash(courseHash2)

            const expectedState = 2
            const exptectedPrice = 0

            assert.equal(course.state, expectedState, "Course is Not deactivated")
            assert.equal(course.price, exptectedPrice, "Course price is Not 0")
        })
    })
})