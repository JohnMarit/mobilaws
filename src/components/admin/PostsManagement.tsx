import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Search, RefreshCw, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/api';
import { useAdmin } from '@/contexts/AdminContext';

interface Post {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPicture?: string;
  userTier?: string;
  createdAt: any;
  likesCount?: number;
  commentsCount?: number;
}

export default function PostsManagement() {
  const { admin } = useAdmin();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('discussions'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      const data = await response.json();
      setPosts(data.discussions || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(postId);
    try {
      // Get admin headers from AdminContext
      const adminEmail = admin?.email || '';
      const adminToken = localStorage.getItem('admin_token') || '';

      const response = await fetch(getApiUrl(`discussions/${postId}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          // Backend will check if user email is in admin emails list
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete post');
      }

      toast.success('Post deleted successfully');
      await loadPosts(); // Reload posts after deletion
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error(error.message || 'Failed to delete post');
    } finally {
      setIsDeleting(null);
    }
  };

  const formatTimeAgo = (timestamp: any): string => {
    if (!timestamp) return 'Unknown';
    
    let seconds: number;
    if (timestamp.seconds !== undefined) {
      seconds = timestamp.seconds;
    } else if (timestamp.toDate) {
      seconds = Math.floor(timestamp.toDate().getTime() / 1000);
    } else if (typeof timestamp === 'number') {
      seconds = timestamp < 10000000000 ? timestamp : Math.floor(timestamp / 1000);
    } else if (timestamp instanceof Date) {
      seconds = Math.floor(timestamp.getTime() / 1000);
    } else {
      return 'Unknown';
    }
    
    const now = Math.floor(Date.now() / 1000);
    const diff = now - seconds;

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 604800)}w ago`;
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Unknown';
    
    let date: Date;
    if (timestamp.seconds !== undefined) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return 'Unknown';
    }
    
    return date.toLocaleString();
  };

  // Filter posts by search term (user name or email)
  const filteredPosts = posts.filter((post) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      post.userName?.toLowerCase().includes(search) ||
      post.userEmail?.toLowerCase().includes(search) ||
      post.content?.toLowerCase().includes(search)
    );
  });

  const getTierBadge = (tier?: string) => {
    if (!tier || tier === 'free') return null;
    const tierLower = tier.toLowerCase();
    if (tierLower === 'premium') {
      return <Badge className="bg-yellow-500">Premium</Badge>;
    } else if (tierLower === 'standard') {
      return <Badge className="bg-gray-500">Standard</Badge>;
    } else if (tierLower === 'basic') {
      return <Badge className="bg-blue-500">Basic</Badge>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Community Posts Management</CardTitle>
          <CardDescription>Manage and moderate community discussion posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Loading posts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Community Posts Management</CardTitle>
            <CardDescription>View, search, and manage community discussion posts</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPosts}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by user name, email, or post content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Posts Table */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'No posts found matching your search' : 'No posts found'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-md">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {post.content}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{post.userName || 'Unknown'}</span>
                          {getTierBadge(post.userTier)}
                        </div>
                        {post.userEmail && (
                          <span className="text-xs text-gray-500">{post.userEmail}</span>
                        )}
                        <span className="text-xs text-gray-400">ID: {post.userId.substring(0, 8)}...</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{formatTimeAgo(post.createdAt)}</span>
                        <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <span>👍 {post.likesCount || 0} likes</span>
                        <span>💬 {post.commentsCount || 0} comments</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                        disabled={isDeleting === post.id}
                      >
                        {isDeleting === post.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredPosts.length} of {posts.length} posts
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      </CardContent>
    </Card>
  );
}
