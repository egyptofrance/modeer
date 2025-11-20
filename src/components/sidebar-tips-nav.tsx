"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Typography } from "@/components/ui/Typography";
import {
  BookOpen,
  DollarSign,
  FileText,
  GitBranch,
  Mail,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "./intl-link";
import { SimpleImageCarousel } from "./simple-image-carousel";
import { Button } from "./ui/button";

// Replaced CreateTeamWorkspaceDialog with a no-op dialog
function CreateTeamWorkspaceDialog() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Users className="h-4 w-4" />
            <span>1. Team Collaboration (Disabled)</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-2">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Team Collaboration is Disabled
          </DialogTitle>
          <DialogDescription>
            This feature is disabled in your current setup (Single-tenant).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Typography.Subtle>
            Your application is configured for a single organization (Single-tenant).
            Team collaboration is managed via user roles and permissions.
          </Typography.Subtle>
          <Typography.Subtle>
            To enable this feature, you would need to switch to a multi-tenant setup.
          </Typography.Subtle>
        </div>
        <DialogClose asChild>
          <Button variant="default">Got it!</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

function InviteUsersDialog() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Mail className="h-4 w-4" />
            <span>2. Invite users to team</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-2">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Invite users to your team
          </DialogTitle>
          <DialogDescription>
            Invite users to your team, assign privileges and
            collaborate together.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <SimpleImageCarousel
            images={[
              {
                src: "/images/tips/members.jpg",
                alt: "A team can have multiple members. Admins can invite users to the team.",
              },
              {
                src: "/images/tips/invite.jpg",
                alt: "Invite users to your team, assign privileges and collaborate together.",
              },
            ]}
          />
        </div>
        <DialogClose asChild>
          <Button variant="default">Got it!</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

function AdminUserDialog() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <GitBranch className="h-4 w-4" />
            <span>3. Make an Application Admin User</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-2">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Nextbase Ultimates ships with an Admin panel
          </DialogTitle>
          <DialogDescription>
            Discover the process of assigning admin privileges to users in your
            application.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <SimpleImageCarousel
            images={[
              {
                src: "/images/tips/admin-panel.jpg",
                alt: "Assign admin privileges to users in your application.",
              },
              {
                src: "/images/tips/admin-payments.jpg",
                alt: "Manage Stripe products and their visibility to your users.",
              },
              {
                src: "/images/tips/admin-payments-2.jpg",
                alt: "View awesome Stripe payments and metrics.",
              },
            ]}
          />
        </div>
        <Button variant="default" asChild>
          <Link
            target="_blank"
            href="https://usenextbase.com/docs/v3/admin-panel/make-user-app-admin"
          >
            How to make a user an app admin?
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function ConnectStripeDialog() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <DollarSign className="h-4 w-4" />
            <span>4. Connect Stripe</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-2">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Connect Stripe and collect payments!
          </DialogTitle>
          <DialogDescription>
            Set up Stripe integration for seamless payment processing in your
            application.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <SimpleImageCarousel
            images={[
              {
                src: "/images/tips/admin-sync-payments.jpg",
                alt: "Sync payments from Stripe to your application.",
              },
              {
                src: "/images/tips/stripe-developers.jpg",
                alt: "Configure stripe webhooks",
              },
              {
                src: "/images/tips/admin-payments.jpg",
                alt: "Stripe products visible to your users.",
              },
            ]}
          />
          <Button variant="default" asChild>
            <Link
              target="_blank"
              href="https://usenextbase.com/docs/v3/admin-panel/setting-up-payments"
            >
              How to set up Stripe payments?
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdminBlogPostDialog() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <FileText className="h-4 w-4" />
            <span>5. Write an Admin Blog Post</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-2">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Share more with your audience with blog posts
          </DialogTitle>
          <DialogDescription>
            Learn how to create and publish blog posts using the admin
            interface.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <SimpleImageCarousel
            images={[
              {
                src: "/images/tips/admin-blog-list.jpg",
                alt: "Manage your blog posts in the admin panel.",
              },
              {
                src: "/images/tips/admin-edit-blog-1.jpg",
                alt: "You can upload images to your blog posts.",
              },
              {
                src: "/images/tips/admin-edit-blog-2.jpg",
                alt: "Markdown editor built-in",
              },
            ]}
          />
        </div>
        <DialogClose asChild>
          <Button variant="default">Got it!</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

function WriteDocsArticleDialog() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <BookOpen className="h-4 w-4" />
            <span>6. Write a Docs Article</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-2">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Write technical docs for your project
          </DialogTitle>
          <DialogDescription>
            Explore the process of writing and organizing documentation for your
            project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <SimpleImageCarousel
            images={[
              {
                src: "/images/tips/docs-guide.jpg",
                alt: "You can write docs for your project.",
              },
            ]}
          />
          <Button variant="default" asChild>
            <Link
              target="_blank"
              href="https://usenextbase.com/docs/v3/guides/creating-docs-page"
            >
              How to create a docs page?
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MoreFeaturesDialog() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Sparkles className="h-4 w-4" />
            <span>7. More Features</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-2">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Nextbase Ultimate is packed with features
          </DialogTitle>
          <DialogDescription>
            Explore the full potential of Nextbase Ultimate.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <SimpleImageCarousel
            images={[
              {
                src: "/images/tips/more-features.jpg",
                alt: "Nextbase Ultimate is packed with features.",
              },
            ]}
          />
        </div>
        <Button variant="default" asChild>
          <Link target="_blank" href="https://usenextbase.com/docs/v3/features">
            Explore all features
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function SidebarTipsNav() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Tips</SidebarGroupLabel>
      <SidebarMenu>
        <CreateTeamWorkspaceDialog />
        <InviteUsersDialog />
        <AdminUserDialog />
        <ConnectStripeDialog />
        <AdminBlogPostDialog />
        <WriteDocsArticleDialog />
        <MoreFeaturesDialog />
      </SidebarMenu>
    </SidebarGroup>
  );
}
