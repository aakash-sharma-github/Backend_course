// asyncHandler using promise

const asyncHandler = requestHandler => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch(error => next(error));
    };
};


// const asyncHandler = (fn) => {}
// // higher order function which can takes and return function
// const asyncHandler = (fn) => async() => {}

// asyncHandler using try and catch
// const asyncHandler = (func) => async (req, res, next) => {
//     try {
//         await func(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             msg: error.message
//         })
//     }
// }



export { asyncHandler };