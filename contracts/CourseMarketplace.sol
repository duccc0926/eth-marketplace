// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract CourseMarketplace {
    enum State {
        Purchased,
        Actived,
        Deactived
    }

    struct Course {
        uint256 id; //32
        uint256 price; //32
        bytes32 proof; //32
        address owner; //20
        State state; //1
    }
    // mapping of courseHash to Course data
    mapping(bytes32 => Course) private ownedCourses;

    //mapping of courseID to courseHash
    mapping(uint256 => bytes32) private ownedCourseHash;

    //number of all courses + id of the courses
    uint256 private totalOwnedCourses;

    address payable private owner;

    bool public isStopped = false;

    ///Course has already a Owner!
    error CourseHashOwner();

    ///Only owner has an access!
    error OnlyOwner();

    ///Course has invalid state!
    error InvalidState();

    ///Course is not created!
    error CourseIsNotCreated();

    /// Sender is not course owner!
    error SenderIsNotCourseOwner();

    constructor() {
        setContractOwner(msg.sender);
    }

    modifier onlyOwner() {
        if (msg.sender != getContractOwner()) {
            revert OnlyOwner();
        }
        _;
    }

    modifier onlyWhenNotStopped() {
        require(!isStopped);
        _;
    }

    modifier onlyWhenStopped() {
        require(!isStopped);
        _;
    }

    receive() external payable {}

    function withdraw(uint256 amount) external onlyOwner {
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Transfer failed");
    }

    function emergencyWithdraw() external onlyWhenStopped onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    function selfDestruct() external onlyWhenStopped {
        selfdestruct(owner);
    }

    function stopContract() external onlyOwner {
        isStopped = true;
    }

    function resumeContract() external onlyOwner {
        isStopped = false;
    }

    function purchaseCourse(
        bytes16 courseId, // 0x00000000000000000000000000003130
        bytes32 proof //0x0000000000000000000000000000313000000000000000000000000000003130
    ) external payable onlyWhenNotStopped {
        bytes32 courseHash = keccak256(abi.encodePacked(courseId, msg.sender));

        if (hasCourseOwnership(courseHash)) {
            revert CourseHashOwner();
        }
        uint256 id = totalOwnedCourses++;
        ownedCourseHash[id] = courseHash;
        ownedCourses[courseHash] = Course({
            id: id,
            price: msg.value,
            proof: proof,
            owner: msg.sender,
            state: State.Purchased
        });
    }

    function repurchaseCourse(bytes32 courseHash)
        external
        payable
        onlyWhenNotStopped
    {
        if (!isCourseCreated(courseHash)) {
            revert CourseIsNotCreated();
        }

        if (!hasCourseOwnership(courseHash)) {
            revert SenderIsNotCourseOwner();
        }

        Course storage course = ownedCourses[courseHash];
        if (course.state != State.Deactived) {
            revert InvalidState();
        }

        course.state = State.Purchased;
        course.price = msg.value;
    }

    function transferOwnership(address newOwner)
        external
        onlyWhenNotStopped
        onlyOwner
    {
        setContractOwner(newOwner);
    }

    function getTotalCount() external view returns (uint256) {
        return totalOwnedCourses;
    }

    function getCourseHashAtIndex(uint256 index)
        external
        view
        returns (bytes32)
    {
        return ownedCourseHash[index];
    }

    function getCourseByHash(bytes32 courseHash)
        external
        view
        returns (Course memory)
    {
        return ownedCourses[courseHash];
    }

    function getContractOwner() public view returns (address) {
        return owner;
    }

    function setContractOwner(address newOwner) private {
        owner = payable(newOwner);
    }

    function hasCourseOwnership(bytes32 courseHash)
        private
        view
        returns (bool)
    {
        return ownedCourses[courseHash].owner == msg.sender;
    }

    function activeCourse(bytes32 courseHash)
        external
        onlyWhenNotStopped
        onlyOwner
    {
        if (!isCourseCreated(courseHash)) {
            revert CourseIsNotCreated();
        }

        Course storage course = ownedCourses[courseHash];

        if (course.state != State.Purchased) {
            revert InvalidState();
        }

        course.state = State.Actived;
    }

    function deactiveCourse(bytes32 courseHash)
        external
        onlyWhenNotStopped
        onlyOwner
    {
        if (!isCourseCreated(courseHash)) {
            revert CourseIsNotCreated();
        }

        Course storage course = ownedCourses[courseHash];

        if (course.state != State.Purchased) {
            revert InvalidState();
        }

        (bool success, ) = course.owner.call{value: course.price}("");
        require(success, "Transfer failed!");

        course.state = State.Deactived;
        course.price = 0;
    }

    function isCourseCreated(bytes32 courseHash) private view returns (bool) {
        return
            ownedCourses[courseHash].owner !=
            0x0000000000000000000000000000000000000000;
    }
}
    