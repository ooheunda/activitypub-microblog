import {
  createFederation,
  Endpoints,
  importJwk,
  exportJwk,
  generateCryptoKeyPair,
  Person,
} from "@fedify/fedify";
import { getLogger } from "@logtape/logtape";
import { MemoryKvStore, InProcessMessageQueue } from "@fedify/fedify";
import db from "./db.ts";
import type { Actor, Key, User } from "./schema.ts";

const logger = getLogger("microblog");

const federation = createFederation({
  kv: new MemoryKvStore(),
  queue: new InProcessMessageQueue(),
});

// 다른 ActivityPub 소프트웨어가 우리 서버의 액터를 조회할 때 쓸 URL과 행동
federation
  .setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
    const user = db
      .prepare<unknown[], User & Actor>(
        `
        SELECT * FROM users
        JOIN actors ON (users.id = actors.user_id)
        WHERE users.username = ?
        `,
      )
      .get(identifier);
    if (user == null) return null;

    const keys = await ctx.getActorKeyPairs(identifier);

    return new Person({
      id: ctx.getActorUri(identifier),
      preferredUsername: identifier,
      name: user.name,
      inbox: ctx.getInboxUri(identifier),
      endpoints: new Endpoints({
        sharedInbox: ctx.getInboxUri(),
      }),
      url: ctx.getActorUri(identifier),
      publicKey: keys[0].cryptographicKey, // 레거시 키 형식
      assertionMethods: keys.map((k) => k.multikey), // 아래의 두 키 형식을 모두 지원하는 배열 형식
    });
  })
  .setKeyPairsDispatcher(async (ctx, identifier) => {
    // setKeyPairsDispatcher: 콜백 함수에서 반환된 키 쌍들을 계정에 연결시켜주는 역할을 함
    // setActorDispatcher에서 getActorKeyPairs()를 통해 여기서 반환된 키(ActorKeyPair)를 가져올 수 있음
    const user = db
      .prepare<unknown[], User>("SELECT * FROM users WHERE username = ?")
      .get(identifier);
    if (user == null) return [];

    const rows = db
      .prepare<unknown[], Key>("SELECT * FROM keys WHERE keys.user_id = ?")
      .all(user.id);
    const keys = Object.fromEntries(
      rows.map((row) => [row.type, row]),
    ) as Record<Key["type"], Key>;

    const pairs: CryptoKeyPair[] = [];
    // 사용자가 지원하는 두 키 형식 (RSASSA-PKCS1-v1_5 & Ed25519) 각각에 대해
    // 키 쌍을 보유하고 있는지 확인하고, 없으면 생성 후 데이터베이스에 저장
    for (const keyType of ["RSASSA-PKCS1-v1_5", "Ed25519"] as const) {
      if (keys[keyType] == null) {
        logger.debug(
          "The user {identifier} does not have an {keyType} key; creating one...",
          { identifier, keyType },
        );

        const { privateKey, publicKey } = await generateCryptoKeyPair(keyType);
        db.prepare(
          `
          INSERT INTO keys (user_id, type, private_key, public_key)
          VALUES (?, ?, ?, ?)
          `,
        ).run(
          user.id,
          keyType,
          JSON.stringify(await exportJwk(privateKey)), // CryptoKey 객체 -> JWK 형식 객체
          JSON.stringify(await exportJwk(publicKey)),
        );

        pairs.push({ privateKey, publicKey });
      } else {
        pairs.push({
          privateKey: await importJwk(
            JSON.parse(keys[keyType].private_key),
            "private",
          ), // JWK 형식 객체 -> CryptoKey 객체
          publicKey: await importJwk(
            JSON.parse(keys[keyType].public_key),
            "public",
          ),
        });
      }
    }

    return pairs;
  });

// getInboxUri()를 위함
federation.setInboxListeners("/users/{identifier}/inbox", "/inbox");

export default federation;
