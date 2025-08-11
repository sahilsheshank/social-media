import "./Post.css";
import { MoreVert } from "@mui/icons-material";
import { useContext, useEffect, useState } from "react";
import { FaRegComment } from "react-icons/fa";
import axios from "axios";
import { format } from "timeago.js";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Post({ post }) {
  const [like, setLike] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(false);
  const [user, setUser] = useState({});
  const [commentToggle, setCommentToggle] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  const PF = import.meta.env.VITE_PUBLIC_FOLDER;
  const { user: currentUser } = useContext(AuthContext);

  const commentHandler = async () => {
    if (!comment.trim()) return; // Prevent empty comment submission
    try {
      await axios.put(`/api/posts/${post._id}/comment`, { comment });
      setComment(""); // Clear the input
      fetchComments(); // Refresh the comments
    } catch (error) {
      console.log(error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${post._id}/comments`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleInputChange = (e) => {
    setComment(e.target.value);
  };

  useEffect(() => {
    setIsLiked(post.likes.includes(currentUser._id));
  }, [currentUser._id, post.likes]);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await axios.get(`/api/users?userId=${post.userId}`);
      setUser(res.data);
    };
    fetchUser();
  }, [post.userId]);

  const likeHandler = () => {
    try {
      axios.put("/api/posts/" + post._id + "/like", { userId: currentUser._id });
    } catch (err) {
      console.log(err);
    }
    setLike(isLiked ? like - 1 : like + 1);
    setIsLiked(!isLiked);
  };

  return (
    <div className="post">
      <div className="postWrapper">
        <div className="postTop">
          <div className="postTopLeft">
            <Link to={`/profile/${user.username}`}>
              <img
                className="postProfileImg"
                src={
                  user.profilePicture
                    ? PF + user.profilePicture
                    : PF + "persons/noUser.png"
                }
                alt=""
              />
            </Link>
            <span className="postUsername">{user.username}</span>
            <span className="postDate">{format(post.createdAt)}</span>
          </div>
          <div className="postTopRight">
            <MoreVert />
          </div>
        </div>
        <div className="postCenter">
          <span className="postText">{post?.desc}</span>
          <img className="postImg" src={PF + post.img} alt="" />
        </div>
        <div className="postBottom">
          <div className="postBottomLeft">
            <img
              className="likeIcon"
              src={`${PF}like.png`}
              onClick={likeHandler}
              alt=""
            />
            <img
              className="likeIcon"
              src={`${PF}heart.png`}
              onClick={likeHandler}
              alt=""
            />
            <span className="commentIcon" onClick={() => setCommentToggle(!commentToggle)}>
              <FaRegComment size={24} />
            </span>
            <span className="postLikeCounter">{like} people like it</span>
          </div>
          <div className="postBottomRight">
            <span className="postCommentText">{comments.length} comments</span>
          </div>
        </div>

        {/* Comment section */}
        {commentToggle && (
          <>
            <div className="commentInput">
              <input
                name="comment"
                className="commentInputBox"
                type="text"
                placeholder="Enter your comment"
                value={comment}
                onChange={handleInputChange}
              />
              <button
                type="submit"
                onClick={commentHandler}
                className="commentButton"
              >
                +
              </button>
            </div>

            <div className="comments-section">
              <h3>Comments</h3>
              <ul>
                {comments.map((singleComment, index) => (
                  <li key={index}>{singleComment}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
