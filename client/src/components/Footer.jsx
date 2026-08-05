import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Button from "@mui/material/Button";
import { useTheme } from "@/hooks/useTheme";

const navigationLinks = [
  { label: "Home", to: "/" },
  { label: "Courses", to: "/courses" },
  { label: "Gallery", to: "/gallery" },
  { label: "Faculty", to: "/faculty" },
  { label: "Events", to: "/events" },
  { label: "About", to: "/about" },
  { label: "FAQ", to: "/faq" },
];

const courseCategories = [
  { label: "Competitive Exams", to: "/courses?category=Competitive%20Exams" },
  { label: "Programming", to: "/courses?category=Programming" },
  { label: "Computer Courses", to: "/courses?category=Computer%20Courses" },
  { label: "Professional Skills", to: "/courses?category=Professional%20Skills" },
];

const legalLinks = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
];

const socials = [
  { alt: "Facebook", src: "./facebook.png", href: "/" },
  {
    alt: "Instagram",
    src: "./instagram.png",
    href: "https://www.instagram.com/mkai2techacademy?igsh=MTlwNHE3ZG53YTdxeA==",
  },
  { alt: "LinkedIn", src: "./linkedin.png", href: "/" },
  { alt: "Twitter", src: "./twitter.png", href: "/" },
  { alt: "YouTube", src: "./youtube.png", href: "/" },
];

const FooterLink = ({ ...props }) => (
  <Link
    component={RouterLink}
    underline="hover"
    sx={{
      color: "inherit",
      fontSize: "0.875rem",
      display: "block",
      py: 0.5,
      "&:hover": { color: "var(--brand-gold)" },
    }}
    {...props}
  />
);

const FooterHeading = ({ children }) => (
  <Typography
    variant="overline"
    sx={{
      display: "block",
      fontWeight: 700,
      letterSpacing: 1,
      mb: 1.5,
      color: "var(--brand-gold)",
    }}
  >
    {children}
  </Typography>
);

const Footer = () => {
  const [email, setEmail] = useState("");
  const { theme } = useTheme();
  const isLight = theme === "light";

  const colors = isLight
    ? {
        // Daylight — warm parchment, a touch deeper than the page so the
        // footer reads as grounded.
        bg: "#efe7d7",
        text: "rgba(36,52,71,0.85)",
        heading: "var(--brand-navy)",
        muted: "rgba(36,52,71,0.6)",
        border: "rgba(36,52,71,0.18)",
        inputBg: "rgba(36,52,71,0.03)",
        divider: "rgba(36,52,71,0.12)",
      }
    : {
        // Warm Espresso
        bg: "#241f18",
        text: "rgba(244,237,226,0.85)",
        heading: "#f4ede2",
        muted: "rgba(244,237,226,0.6)",
        border: "rgba(244,237,226,0.22)",
        inputBg: "rgba(244,237,226,0.05)",
        divider: "rgba(244,237,226,0.14)",
      };

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: colors.bg,
        color: colors.text,
        borderTop: isLight ? "1px solid var(--brand-light-gray)" : "none",
      }}
    >
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1.4fr 1fr 1fr 1.2fr" },
            gap: 4,
          }}
        >
          {/* Brand */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  display: "inline-flex",
                  p: 0.5,
                  borderRadius: "50%",
                  bgcolor: "#faf4e8",
                  boxShadow: isLight
                    ? "0 0 0 1px rgba(36,52,71,0.08)"
                    : "0 0 0 1px rgba(212,160,23,0.4)",
                }}
              >
                <Box
                  component="img"
                  src="./mKai2Tech.png"
                  alt="mKai2Tech Logo"
                  sx={{ width: 36, height: 36, objectFit: "contain" }}
                />
              </Box>
              <Typography variant="subtitle1" sx={{ color: colors.heading, fontWeight: 600 }}>
                M Kai² Tech Academy
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: colors.muted, mb: 2, maxWidth: 280 }}>
              School academics, competitive exam prep, computer skills, and programming — taught
              in person in Lucknow.
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, ml: -0.5 }}>
              {socials.map((s) => (
                <IconButton
                  key={s.alt}
                  component="a"
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{ opacity: 0.8, "&:hover": { opacity: 1 } }}
                >
                  <Box component="img" src={s.src} alt={s.alt} sx={{ width: 18, height: 18 }} />
                </IconButton>
              ))}
            </Box>
          </Box>

          {/* Navigation */}
          <Box>
            <FooterHeading>Navigation</FooterHeading>
            {navigationLinks.map((link) => (
              <FooterLink key={link.to} to={link.to}>
                {link.label}
              </FooterLink>
            ))}
          </Box>

          {/* Explore courses */}
          <Box>
            <FooterHeading>Explore Courses</FooterHeading>
            {courseCategories.map((link) => (
              <FooterLink key={link.to} to={link.to}>
                {link.label}
              </FooterLink>
            ))}
          </Box>

          {/* Contact + newsletter */}
          <Box>
            <FooterHeading>Contact Us</FooterHeading>
            <Typography variant="body2" sx={{ color: colors.text, mb: 0.5 }}>
              mkai2techacademy@gmail.com
            </Typography>
            <Typography variant="body2" sx={{ color: colors.text, mb: 0.5 }}>
              +91 8881439401
            </Typography>
            <Typography variant="body2" sx={{ color: colors.muted, mb: 2 }}>
              Shop No-24, Bhola Market Sugamau Road, Near CIS, Indira Nagar, Lucknow-226016
            </Typography>

            <Typography
              variant="caption"
              sx={{ color: colors.muted, display: "block", mb: 1 }}
            >
              Get updates on new batches
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 20,
                  px: 1.5,
                  py: 0.25,
                  bgcolor: colors.inputBg,
                  flexGrow: 1,
                }}
              >
                <InputBase
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{
                    color: colors.heading,
                    fontSize: "0.875rem",
                    width: "100%",
                    "& ::placeholder": { color: colors.muted, opacity: 1 },
                  }}
                />
              </Box>
              <Button
                size="small"
                sx={{
                  bgcolor: "var(--brand-gold)",
                  color: "var(--brand-navy)",
                  fontWeight: 600,
                  borderRadius: 20,
                  textTransform: "none",
                  px: 2,
                  whiteSpace: "nowrap",
                  "&:hover": { bgcolor: "var(--brand-gold)", opacity: 0.9 },
                }}
              >
                Subscribe
              </Button>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 4, borderColor: colors.divider }} />

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="caption" sx={{ color: colors.muted }}>
            © 2026 M kai² Tech Academy. All rights reserved.
          </Typography>

          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" }}>
            {legalLinks.map((link) => (
              <FooterLink key={link.to} to={link.to} sx={{ py: 0, fontSize: "0.75rem" }}>
                {link.label}
              </FooterLink>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
