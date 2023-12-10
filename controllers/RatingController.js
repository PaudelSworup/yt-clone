import RatingModel from "../models/RatingModel.js";

export const provideRating = async (req, res) => {
  console.log(req.body.book);
  console.log(req.body.user);
  let alreadyRated = await RatingModel.findOne({
    video: req.body.video,
    user: req.body.user,
  });

  if (alreadyRated) {
    return res.status(400).json({
      success: false,
      error: "Review/Ratings has been recorded previously",
    });
  }
  let videoRating = new RatingModel({
    rating: Number(req.body.rating),
    video: req.body.video,
    user: req.body.user,
  });

  videoRating = await videoRating.save();

  if (!videoRating) {
    res.status(400).json({
      success: false,
      error: "Something went wrong",
    });
  }

  res.cookie("userID", req.body.user, { httpOnly: true });
  return res.status(200).send({
    success: true,
    message: "your ratings was recorded",
  });
};

export const getratingsDetails = async (req, res) => {
  let details = await RatingModel.find()
    .populate("video", "title imgUrl  videoUrl")
    .populate("user", "name  email");

  if (!details) {
    res.status(400).json({
      success: false,
      error: "Something went wrong",
    });
  }
  return res.status(200).send({
    success: true,
    details,
  });
};

export const getSingle = async (req, res) => {
  let video = await RatingModel.find({ video: req.params.video }).populate(
    "video",
    "title , imageUrl , videoUrl"
  );
  if (!video) {
    res.status(400).json({
      success: false,
      error: "Something went wrong",
    });
  }
  return res.status(200).send({
    success: true,
    video,
  });
};

export const recommendedVideos = async (req, res) => {
  console.log(req.params.id);
  const data = await RatingModel.find().populate({
    path: "video",
    select: "title imgUrl  videoUrl",
  });

  const dataGTE3 = data.filter((rating) => rating?.rating >= 3);
  // const data = await Ratings.find().populate(
  //   "book",
  //   "title category image isbn desc stock yearofpublication"
  // );

  // create a matrix of user ratings
  const matrix = dataGTE3.reduce((matrix, { user, video, rating }) => {
    if (!matrix[user]) matrix[user] = {};
    matrix[user][video] = rating;
    return matrix;
  }, {});

  // calculate the similarities between books
  const videoSimilarities = {};
  Object.keys(matrix).forEach((user) => {
    Object.keys(matrix[user]).forEach((video1) => {
      Object.keys(matrix[user]).forEach((video2) => {
        if (video1 === video2) return;
        if (videoSimilarities[video1] && videoSimilarities[video1][video2])
          return;
        if (!videoSimilarities[video1]) videoSimilarities[video1] = {};
        const numerator = Object.keys(matrix).reduce((sum, otherUser) => {
          if (matrix[otherUser][video1] && matrix[otherUser][video2]) {
            sum += matrix[otherUser][video1] * matrix[otherUser][video2];
          }
          return sum;
        }, 0);
        const denominator = Object.keys(matrix).reduce((sum, otherUser) => {
          if (matrix[otherUser][video1] && matrix[otherUser][video2]) {
            sum +=
              Math.pow(matrix[otherUser][video1], 2) *
              Math.pow(matrix[otherUser][video2], 2);
          }
          return sum;
        }, 0);
        videoSimilarities[video1][video2] = numerator / Math.sqrt(denominator);
      });
    });
  });

  // generate recommendations for a given user
  const recommend = (user) => {
    console.log(user);
    const userRatings = matrix[user];
    if (!userRatings) {
      return []; // or handle the case when userRatings is not available
    }

    const bookScores = {};
    Object.keys(userRatings).forEach((video1) => {
      if (!videoSimilarities[video1]) {
        return; // Skip if there are no similarities calculated for book1
      }

      Object.keys(videoSimilarities[video1]).forEach((video2) => {
        if (userRatings[video2]) return;
        if (!bookScores[video2]) bookScores[video2] = 0;
        bookScores[video2] +=
          videoSimilarities[video1][video2] * userRatings[video1];
      });
    });
    const recommendations = Object.keys(bookScores).sort(
      (a, b) => bookScores[b] - bookScores[a]
    );

    // return recommendations;

    const idRegex = /_id:\s*new\s+ObjectId\("(\w+)"\)/;
    const titleRegex = /title:\s*'([^']*)'/;
    const videoRegex = /videoUrl:\s*'([^']*)'/;
    const imageRegex = /imgUrl:\s*'([^']*)'/;

    let newRecommendations = [];
    recommendations.forEach((video) => {
      const idMatch = video.match(idRegex);
      const titleMatch = video.match(titleRegex);
      const videoMatch = video.match(videoRegex);
      const imageMatch = video.match(imageRegex);

      if (titleMatch && videoMatch) {
        const title = titleMatch[1];
        const video = videoMatch[1];
        const image = imageMatch[1];
        const _id = idMatch[1];
        newRecommendations.push({
          _id,
          title,
          video,
          image,
        });
      }
    });
    console.log(newRecommendations);
    return newRecommendations;
  };
  const recommendations = recommend(req.params.id);
  console.log(recommendations);
  return res.status(200).json({
    success: true,
    recommendations,
  });
};
