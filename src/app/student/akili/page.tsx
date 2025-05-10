'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Sparkles, Loader2, User } from 'lucide-react';
import { processStudentMessage, AkiliChatInput } from '@/ai/flows/akili-chat-flow';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/shared/Logo';

interface Message {
  id: string;
  sender: 'user' | 'akili';
  text: string;
  avatar?: string;
  name?: string;
}

export default function AkiliChatPage() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      sender: 'user',
      text: inputValue,
      name: currentUser?.displayName || 'You',
      avatar: currentUser?.photoURL || undefined,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoadingAiResponse(true);

    try {
      const aiInput: AkiliChatInput = { studentMessage: userMessage.text };
      const response = await processStudentMessage(aiInput);
      
      const akiliMessage: Message = {
        id: Date.now().toString() + '-akili',
        sender: 'akili',
        text: response.akiliResponse,
        name: 'Akili',
        avatar: '/logo-icon.png' // Path to Akili's avatar
      };
      setMessages((prevMessages) => [...prevMessages, akiliMessage]);
    } catch (error) {
      console.error('Error getting response from Akili:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        sender: 'akili',
        text: 'Sorry, I encountered an error. Please try again.',
        name: 'Akili',
        avatar: '/logo-icon.png'
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoadingAiResponse(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-2xl h-full flex flex-col card-shadow">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center text-xl sm:text-2xl">
            <Sparkles className="mr-2 h-6 w-6 text-primary" />
            Akili: Your Smart Study Companion
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow p-0 overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Logo className="mb-4 h-16 w-auto" />
                <p className="text-muted-foreground">Ask me anything about your studies!</p>
              </div>
            )}
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'akili' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.avatar} alt={msg.name} />
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 text-sm sm:text-base break-words ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.sender === 'user' && (
                    <Avatar className="h-8 w-8">
                       {currentUser?.photoURL ? <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName || "User"} /> : null}
                      <AvatarFallback>
                        {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <User className="h-4 w-4"/>}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoadingAiResponse && (
                <div className="flex items-end gap-2 justify-start">
                   <Avatar className="h-8 w-8">
                      <AvatarImage src="/logo-icon.png" alt="Akili" />
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                  <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex w-full items-center space-x-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Akili a question..."
              className="flex-1"
              disabled={isLoadingAiResponse}
            />
            <Button type="submit" size="icon" disabled={isLoadingAiResponse || !inputValue.trim()} className="button-shadow">
              <Send className="h-5 w-5" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
