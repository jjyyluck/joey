import Link from "next/link";
import { Avatar } from "./Avatar";
import { FollowButton } from "./FollowButton";

type Props = {
  author: { id: string; name: string; bio: string } | null;
  fallbackName: string;
  following: boolean;
  signedIn: boolean;
  isMe: boolean;
  size?: number;
};

/** Avatar + name + bio + follow. Licensed-library stories have no account, so they show the name only. */
export function AuthorBar({ author, fallbackName, following, signedIn, isMe, size = 40 }: Props) {
  if (!author)
    return (
      <div className="author">
        <Avatar name={fallbackName} size={size} />
        <span className="who">
          <b>{fallbackName}</b>
          <span>平台授权作品</span>
        </span>
      </div>
    );
  return (
    <div className="author">
      <Link href={`/u/${author.id}`} aria-label={`${author.name}的主页`}>
        <Avatar name={author.name} size={size} />
      </Link>
      <Link href={`/u/${author.id}`} className="who">
        <b>{author.name}</b>
        <span>{author.bio || "这个作者还没有写签名"}</span>
      </Link>
      {!isMe && <FollowButton userId={author.id} on={following} signedIn={signedIn} />}
    </div>
  );
}
