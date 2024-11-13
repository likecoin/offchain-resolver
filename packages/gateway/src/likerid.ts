import axios, { AxiosError } from 'axios';
import { Database } from './server';
import { ETH_COIN_TYPE, COSMOS_COIN_TYPE, EVM_COIN_TYPE_THRESHOLD } from './utils';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const EMPTY_CONTENT_HASH = '0x';

const TEXT_KEY_TO_FIELD_NAME: { [key: string]: string } = {
  display: 'displayName',
  avatar: 'avatar',
  email: 'email',
  description: 'description',
  'addr.likecoin': 'likecoinWallet',
  url: 'url',
};

function coinTypeToFieldName(coinType: number): string | null {
  if (coinType === ETH_COIN_TYPE || coinType > EVM_COIN_TYPE_THRESHOLD) {
    return 'evmWallet';
  }
  if (coinType === COSMOS_COIN_TYPE) {
    return 'cosmosWallet';
  }
  return null;
}

function isLikeCoEns(name: string): boolean {
  return name.split('.').length === 4 && name.endsWith('id.like.co');
}

function isLikerLandEns(name: string): boolean {
  return name.split('.').length === 4 && name.endsWith('id.liker.land');
}

export class LikerIdDatabase implements Database {
  ttl: number;
  isTestnet: boolean;

  constructor(ttl: number, isTestnet: boolean) {
    this.ttl = ttl;
    this.isTestnet = isTestnet;
  }

  async addr(name: string, coinType: number) {
    const fieldName = coinTypeToFieldName(coinType);
    if (!fieldName) {
      return { addr: ZERO_ADDRESS, ttl: this.ttl };
    }
    const user = await this.findLikerId(name);
    if (!user || !user[fieldName]) {
      return { addr: ZERO_ADDRESS, ttl: this.ttl };
    }
    return { addr: user[fieldName], ttl: this.ttl };
  }

  async text(name: string, key: string) {
    const fieldName = TEXT_KEY_TO_FIELD_NAME[key];
    if (!fieldName) {
      return { value: '', ttl: this.ttl };
    }
    const likerId = await this.findLikerId(name);
    if (key === 'url') {

    }
    if (!likerId || !likerId[fieldName]) {
      return { value: '', ttl: this.ttl };
    }
    return { value: likerId[fieldName], ttl: this.ttl };
  }

  contenthash(_: string) {
    return { contenthash: EMPTY_CONTENT_HASH, ttl: this.ttl };
  }

  private async findLikerId(name: string): Promise<any> {
    try {
      const isLikeCo = isLikeCoEns(name);
      const isLikerLand = isLikerLandEns(name);
      if (!isLikeCo && !isLikerLand) {
        return null;
      }
      const likerId = name.split('.')[0];
      const { data = {} } = await axios.get(`https://api.${this.isTestnet ? 'rinkeby.' : ''}like.co/users/id/${likerId}/min`);
      let hostAndPath = isLikerLand ? 'liker.land' : 'like.co/in';
      if (this.isTestnet) {
        hostAndPath = `rinkeby.${hostAndPath}`;
      }
      const url = `https://${hostAndPath}/${likerId}`;
      return {
        url,
        ...data,
      };
    } catch (e) {
      if ((e as AxiosError).response?.status !== 404) {
        console.error(`Failed to resolve liker id for ${name}: ${(e as Error).message}`);
      }
      return null;
    }
  }
}
