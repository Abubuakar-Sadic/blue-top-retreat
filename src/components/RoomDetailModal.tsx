import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Wifi, Wind, Tv, Coffee, Bath, Car, UtensilsCrossed, Shield } from "lucide-react";

interface RoomDetail {
  name: string;
  description: string;
  price: string;
  image: string;
  longDescription: string;
  amenities: { icon: React.ReactNode; label: string }[];
  features: string[];
}

const amenityIcons = {
  wifi: <Wifi className="w-5 h-5" />,
  ac: <Wind className="w-5 h-5" />,
  tv: <Tv className="w-5 h-5" />,
  coffee: <Coffee className="w-5 h-5" />,
  bath: <Bath className="w-5 h-5" />,
  parking: <Car className="w-5 h-5" />,
  dining: <UtensilsCrossed className="w-5 h-5" />,
  security: <Shield className="w-5 h-5" />,
};

export const roomDetails: Record<string, Omit<RoomDetail, "name" | "description" | "price" | "image">> = {
  "Standard Room": {
    longDescription:
      "Our Standard Room offers a comfortable retreat with twin beds, ideal for business travelers and short getaways. Modern furnishings meet warm Ghanaian hospitality in a clean, well-appointed space.",
    amenities: [
      { icon: amenityIcons.wifi, label: "Free Wi-Fi" },
      { icon: amenityIcons.ac, label: "Air Conditioning" },
      { icon: amenityIcons.tv, label: "Flat-screen TV" },
      { icon: amenityIcons.bath, label: "Private Bathroom" },
      { icon: amenityIcons.security, label: "24/7 Security" },
    ],
    features: ["Twin beds", "Work desk", "Wardrobe", "Daily housekeeping", "Complimentary toiletries"],
  },
  "Deluxe Room": {
    longDescription:
      "Step into luxury with our Deluxe Room featuring a king-size bed, premium furnishings, and stunning city views. The spacious en-suite bathroom and elegant décor make every stay memorable.",
    amenities: [
      { icon: amenityIcons.wifi, label: "Free Wi-Fi" },
      { icon: amenityIcons.ac, label: "Air Conditioning" },
      { icon: amenityIcons.tv, label: "Smart TV" },
      { icon: amenityIcons.coffee, label: "Coffee Maker" },
      { icon: amenityIcons.bath, label: "Luxury Bathroom" },
      { icon: amenityIcons.parking, label: "Free Parking" },
    ],
    features: ["King-size bed", "City views", "Mini fridge", "Bathrobe & slippers", "Premium toiletries", "Room service"],
  },
  "Executive Suite": {
    longDescription:
      "Our finest accommodation, the Executive Suite offers a separate living area, premium décor, and VIP amenities. Perfect for discerning guests who demand the very best in comfort and style.",
    amenities: [
      { icon: amenityIcons.wifi, label: "High-speed Wi-Fi" },
      { icon: amenityIcons.ac, label: "Climate Control" },
      { icon: amenityIcons.tv, label: "65\" Smart TV" },
      { icon: amenityIcons.coffee, label: "Nespresso Machine" },
      { icon: amenityIcons.bath, label: "Spa Bathroom" },
      { icon: amenityIcons.parking, label: "VIP Parking" },
      { icon: amenityIcons.dining, label: "In-room Dining" },
      { icon: amenityIcons.security, label: "24/7 Concierge" },
    ],
    features: [
      "King-size bed",
      "Separate living area",
      "Panoramic views",
      "Walk-in closet",
      "Jacuzzi tub",
      "Complimentary breakfast",
      "Late checkout",
    ],
  },
};

interface RoomDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: { name: string; description: string; price: string; image: string } | null;
}

const RoomDetailModal = ({ open, onOpenChange, room }: RoomDetailModalProps) => {
  if (!room) return null;
  const details = roomDetails[room.name];
  if (!details) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-background border-gold/20">
        <div className="overflow-hidden rounded-t-lg">
          <img
            src={room.image}
            alt={room.name}
            className="w-full aspect-[16/9] object-cover"
          />
        </div>
        <div className="p-6 space-y-6">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-foreground">{room.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-base mt-2">
              {details.longDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <span className="text-gold font-display text-xl font-semibold">{room.price}</span>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-3">Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {details.amenities.map((a) => (
                <div key={a.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-gold">{a.icon}</span>
                  {a.label}
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-3">Room Features</h3>
            <ul className="grid grid-cols-2 gap-2">
              {details.features.map((f) => (
                <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <a
            href="#booking"
            onClick={() => onOpenChange(false)}
            className="inline-block w-full text-center py-3 rounded-lg bg-gold text-navy-dark font-semibold hover:bg-gold/90 transition-colors"
          >
            Book This Room
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomDetailModal;
