const asyncHandler = (requestHandler) => {
    return (req, res, next)=>{
        Promise.resolve(requestHandler(req, res, next)).catch((err)=> next(err))
    }
}

export {asyncHandler}


// higher order function - accepts fun as param and can return also
// const asyncHandler = (fun) =>{()=>{}} or
// const asyncHandler = (fun) =>()=>{}

// const asyncHandler = (fun) => async (req, res, next) =>{
//     try{
//         await fun(req, res, next)
//     }catch(error){
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }