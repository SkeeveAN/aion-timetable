import tiamarantaEye from "../assets/maps/tiamaranta-eye.jpg";
import heiron from "../assets/maps/heiron.jpg";
import inggison from "../assets/maps/inggison.jpg";
import gelkmaros from "../assets/maps/gelkmaros.jpg";
import reshantaCore from "../assets/maps/reshanta-core.jpg";
import reshantaTop from "../assets/maps/reshanta-top.jpg";
import sarpan from "../assets/maps/sarpan.jpg";
import tiamaranta from "../assets/maps/tiamaranta.jpg";
import eltnen from "../assets/maps/eltnen.jpg";

/**
 * Maps a world boss's canonical key to the zone map image to render pins on.
 * Bosses not listed here have no pinned coordinates yet - the location list
 * (WorldBossPanel) still works for them regardless.
 */
export const BOSS_MAP_ZONES: Record<string, string> = {
  dabra: tiamarantaEye,
  zumita: tiamarantaEye,
  governor_sunayaka: tiamarantaEye,
  berserker_sunayaka: tiamarantaEye,
  high_priest_yatri: heiron,
  scout_dehavi: heiron,
  bollvig_blackheart: heiron,
  high_mage_brashuna: heiron,
  bulwark_jeshuchi: heiron,
  guardian_vingeveu: heiron,
  watcher_zapiel: heiron,
  deputy_hanuman: heiron,
  medeus_the_vile: heiron,
  omega: inggison,
  ragnarok: gelkmaros,
  menotios: reshantaCore,
  moltenus: reshantaTop,
  debarim_the_omnipotent: sarpan,
  ativas_crystalline: tiamaranta,
  kradi_the_glutton: tiamaranta,
  golden_tatar: tiamaranta,
  grand_chieftain_saendukal: eltnen,
};
