import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Wifi, Wind, Tv, Coffee, Bath, Car, UtensilsCrossed, Shield, Refrigerator,
  Waves, Dumbbell, BedDouble, Wine, Lock, Phone, Sparkles, Users, type LucideIcon,
} from "lucide-react";

// Resolve an amenity label (admin free-text) to a fitting icon
const resolveAmenityIcon = (label: string): LucideIcon => {
  const l = label.toLowerCase();
  if (/wi-?fi|internet|network/.test(l)) return Wifi;
  if (/air ?con|a\/?c\b|climate|cooling/.test(l)) return Wind;
  if (/tv|television|netflix|screen/.test(l)) return Tv;
  if (/coffee|tea|nespresso|kettle/.test(l)) return Coffee;
  if (/fridge|mini.?bar|refrig/.test(l)) return Refrigerator;
  if (/bath|shower|jacuzzi|tub|toiletr/.test(l)) return Bath;
  if (/park/.test(l)) return Car;
  if (/din|breakfast|restaurant|food|meal/.test(l)) return UtensilsCrossed;
  if (/secur|safe|guard|cctv/.test(l)) return Shield;
  if (/pool|swim|water/.test(l)) return Waves;
  if (/gym|fitness|workout/.test(l)) return Dumbbell;
  if (/bed|king|queen|twin/.test(l)) return BedDouble;
  if (/bar|wine|drink|minibar/.test(l)) return Wine;
  if (/lock|key|access/.test(l)) return Lock;
  if (/phone|call/.test(l)) return Phone;
  if (/concierge|service|housekeep/.test(l)) return Users;
  return Sparkles;
};

const presetFeatures: Record<string, string[]> = {
  "Standard Room": ["Twin beds", "Work desk", "Wardrobe", "Daily housekeeping", "Complimentary toiletries"],
  "Deluxe Room": ["King-size bed", "City views", "Mini fridge", "Bathrobe & slippers", "Premium toiletries", "Room service"],
  "Executive Suite": ["King-size bed", "Separate living area", "Panoramic views", "Walk-in closet", "Jacuzzi tub", "Complimentary breakfast", "Late checkout"],
};

type RoomLike = {
  id?: string;
  room_name: string;
  description?: string | null;
  price_per_night?: number;
  featured_image?: string | null;
  gallery_images?: string[] | null;
  capacity?: number;
  amenities?: string[];
};

interface RoomDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: RoomLike | null;
  onBook?: () => void;
}

const RoomDetailModal = ({ open, onOpenChange, room, onBook }: RoomDetailModalProps) => {
  if (!room) return null;
  const longDescription = room.description ?? "";
  const features = presetFeatures[room.room_name] ?? [];
  const amenityLabels = room.amenities ?? [];
  const gallery = (room.gallery_images ?? []).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-background border-gold/20">
        <div className="overflow-hidden rounded-t-lg">
          <img
            src={room.featured_image || "/placeholder.svg"}
            alt={room.room_name}
            className="w-full aspect-[16/9] object-cover"
          />
        </div>
        <div className="p-6 space-y-6">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-foreground">{room.room_name}</DialogTitle>
            {longDescription && (
              <DialogDescription className="text-muted-foreground text-base mt-2">
                {longDescription}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Price card */}
          <div className="flex items-center justify-between rounded-xl border border-gold/30 bg-gold/5 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Price per night</p>
              <p className="text-gold font-display text-2xl font-bold">GHS {Number(room.price_per_night ?? 0).toLocaleString()}</p>
            </div>
            {room.capacity ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4 text-gold" /> Sleeps {room.capacity}
              </div>
            ) : null}
          </div>

          {/* Gallery */}
          {gallery.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {gallery.slice(0, 6).map((g, i) => (
                <img key={i} src={g} alt={`${room.room_name} photo ${i + 1}`} loading="lazy"
                  className="aspect-square w-full rounded-lg object-cover border border-border/60" />
              ))}
            </div>
          )}

          {/* Amenities */}
          {amenityLabels.length > 0 && <div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-3">Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenityLabels.map((label) => {
                const Icon = resolveAmenityIcon(label);
                return (
                  <div key={label} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gold/10 text-gold">
                      <Icon className="w-4.5 h-4.5" />
                    </span>
                    <span className="text-sm font-medium text-foreground leading-tight">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>}

          {/* Features */}
          {features.length > 0 && <div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-3">Room Features</h3>
            <ul className="grid grid-cols-2 gap-2">
              {features.map((f) => (
                <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>}

          <button
            onClick={() => { onBook ? onBook() : onOpenChange(false); }}
            className="inline-block w-full text-center py-3 rounded-lg bg-gold text-navy-dark font-semibold hover:bg-gold/90 transition-colors"
          >
            Book This Room
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomDetailModal;
