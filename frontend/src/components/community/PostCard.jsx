import { Link } from "react-router-dom";
import { count, date, initials } from "../../utils/format";
import { Icon } from "../common/UI";
export default function PostCard({ post }) {
  return (
    <article className="post-card">
      <div className="post-author">
        <span className="avatar mini">{initials(post.author_name)}</span>
        <span>
          {post.author_name}
          <small>{date(post.created_at)}</small>
        </span>
        <span className="tag">Finance</span>
      </div>
      <h2>
        <Link to={`/community/${post.id}`}>{post.title}</Link>
      </h2>
      <p className="clamp-two">{post.content}</p>
      <div className="post-meta">
        <span>
          <Icon name="message" />
          {count(post.comment_count)} comments
        </span>
        <span>{count(post.helpful_count)} found helpful</span>
        <Link to={`/community/${post.id}`} aria-label={`Read ${post.title}`}>
          <Icon />
        </Link>
      </div>
    </article>
  );
}
