import { useEffect, useState, useRef } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Send } from "lucide-react";
import { AvatarWithBadge } from "@/components/ui/avatar-with-badge";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Helmet } from "react-helmet";

export default function MessagingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const { userId } = params;
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<number | null>(
    userId ? parseInt(userId) : null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all conversations
  const {
    data: conversations,
    isLoading: isLoadingConversations,
  } = useQuery({
    queryKey: ["/api/messages"],
    queryFn: async () => {
      const res = await fetch("/api/messages", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch conversations");
      }
      return res.json();
    },
    enabled: !!user,
  });

  // Fetch selected conversation messages
  const {
    data: conversationData,
    isLoading: isLoadingMessages,
  } = useQuery({
    queryKey: ["/api/messages", selectedConversation],
    queryFn: async () => {
      const res = await fetch(`/api/messages/${selectedConversation}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch messages");
      }
      return res.json();
    },
    enabled: !!selectedConversation && !!user,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversation) throw new Error("No conversation selected");
      
      const res = await apiRequest("POST", "/api/messages", {
        receiverId: selectedConversation,
        content,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessage("");
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    sendMessageMutation.mutate(message);
  };

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationData]);

  // Update URL when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      setLocation(`/messages/${selectedConversation}`, { replace: true });
    }
  }, [selectedConversation, setLocation]);

  // Redirect if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Set up WebSocket connection for real-time messaging
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.addEventListener("message", (event) => {
      // When we receive a message, refresh the messages
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        if (selectedConversation === data.senderId || selectedConversation === data.receiverId) {
          queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
        }
      }
    });

    socket.addEventListener("close", () => {
      // Reconnect logic
      setTimeout(() => {
        if (user) {
          // Only reconnect if still logged in
          // In a production app, we'd implement more robust reconnection logic
        }
      }, 1000);
    });

    return () => {
      socket.close();
    };
  }, [user, selectedConversation]);

  // Format messages by date
  const formatMessagesByDate = (messages: any[]) => {
    if (!messages) return [];

    const grouped: { [date: string]: any[] } = {};
    messages.forEach((message) => {
      const date = new Date(message.createdAt).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });

    return Object.entries(grouped).map(([date, msgs]) => ({
      date,
      messages: msgs,
    }));
  };

  const messagesByDate = conversationData?.messages 
    ? formatMessagesByDate(conversationData.messages) 
    : [];

  return (
    <>
      <Helmet>
        <title>Messages - LuggageLink</title>
        <meta name="description" content="Communicate with travelers and senders on LuggageLink. Discuss package details, arrangements, and delivery information securely." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="flex h-[calc(80vh-100px)]">
                {/* Conversations sidebar */}
                <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                  {isLoadingConversations ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : conversations && conversations.length > 0 ? (
                    <div>
                      {conversations.map((conversation: any) => (
                        <div
                          key={conversation.user.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 ${
                            selectedConversation === conversation.user.id
                              ? "bg-primary-50 border-l-4 border-primary-500"
                              : ""
                          }`}
                          onClick={() => setSelectedConversation(conversation.user.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <AvatarWithBadge
                              firstName={conversation.user.firstName}
                              lastName={conversation.user.lastName}
                              showBadge={conversation.unreadCount > 0}
                              badgeColor="bg-primary-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {conversation.user.firstName} {conversation.user.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(conversation.lastMessage.createdAt, "p")}
                                </p>
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {conversation.lastMessage.senderId === user.id ? (
                                  <span className="text-gray-400">You: </span>
                                ) : null}
                                {conversation.lastMessage.content}
                              </p>
                            </div>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <div className="mt-1 flex justify-end">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                {conversation.unreadCount} new
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <div className="bg-gray-100 rounded-full p-3 mb-4">
                        <Send className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        When you connect with travelers or senders, your conversations will appear here.
                      </p>
                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation("/travelers")}
                        >
                          Find Travelers
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setLocation("/packages")}
                        >
                          Browse Packages
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message area */}
                <div className="w-2/3 flex flex-col">
                  {selectedConversation ? (
                    <>
                      {/* Conversation header */}
                      <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
                        {conversationData?.user && (
                          <>
                            <AvatarWithBadge
                              firstName={conversationData.user.firstName}
                              lastName={conversationData.user.lastName}
                            />
                            <div>
                              <h2 className="text-lg font-medium text-gray-900">
                                {conversationData.user.firstName} {conversationData.user.lastName}
                              </h2>
                              <p className="text-sm text-gray-500">
                                @{conversationData.user.username}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Message list */}
                      <div className="flex-1 p-4 overflow-y-auto">
                        {isLoadingMessages ? (
                          <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : messagesByDate.length > 0 ? (
                          <div className="space-y-6">
                            {messagesByDate.map((group) => (
                              <div key={group.date}>
                                <div className="relative flex items-center py-5">
                                  <div className="flex-grow border-t border-gray-200"></div>
                                  <span className="flex-shrink mx-4 text-xs text-gray-400">
                                    {formatDate(new Date(group.date), "PPP")}
                                  </span>
                                  <div className="flex-grow border-t border-gray-200"></div>
                                </div>

                                <div className="space-y-4">
                                  {group.messages.map((message: any) => (
                                    <div
                                      key={message.id}
                                      className={`flex ${
                                        message.senderId === user.id ? "justify-end" : "justify-start"
                                      }`}
                                    >
                                      <div
                                        className={`max-w-[70%] rounded-lg p-3 ${
                                          message.senderId === user.id
                                            ? "bg-primary-600 text-white"
                                            : "bg-gray-100 text-gray-800"
                                        }`}
                                      >
                                        <p className="text-sm">{message.content}</p>
                                        <div
                                          className={`text-xs mt-1 ${
                                            message.senderId === user.id
                                              ? "text-primary-100"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          {formatDate(message.createdAt, "p")}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="bg-gray-100 rounded-full p-3 mb-4">
                              <Send className="h-6 w-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                              Start a conversation
                            </h3>
                            <p className="text-sm text-gray-500 max-w-md">
                              Send a message to start discussing delivery details, pricing, or
                              any questions you might have.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Message input */}
                      <div className="p-4 border-t border-gray-200">
                        <form
                          onSubmit={handleSendMessage}
                          className="flex items-center space-x-2"
                        >
                          <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1"
                          />
                          <Button
                            type="submit"
                            disabled={!message.trim() || sendMessageMutation.isPending}
                          >
                            {sendMessageMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            <span className="ml-2">Send</span>
                          </Button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <div className="bg-gray-100 rounded-full p-5 mb-4">
                        <Send className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-gray-500 max-w-md">
                        Choose a conversation from the list to start messaging with travelers
                        or package senders.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
