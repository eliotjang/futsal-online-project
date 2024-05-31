import jwt from 'jsonwebtoken';
import configs from '../utils/configs.js';
import {prisma} from '../utils/prisma/index.js';

export default async (req, res, next) => {
  try {
    const { authorization } = req.cookies;
    const [tokenType, token] = authorization.split(' ');

    // 토큰 타입 확인
    if (tokenType !== 'Bearer') {
        throw new Error("토큰 타입이 일치하지 않습니다.")
    }

    const decodedToken = jwt.verify(token, configs.tokenSecretKey);
    const userId = decodedToken.userId;

    const user = await prisma.user.findFirst({
        where: {userId}
    })
    if (!user) {
        res.clearCookie("authorization");
        throw new Error("토큰 사용자가 존재하지 않습니다.")
    }

    req.user = user;
    next();
  } catch (err) {
    res.clearCookie("authorization");

    switch (err.name) {
      case 'JsonWebTokenError':
        return res.status(400).json({ errorMessage: '토큰이 잘못되었습니다.' });
      default:
        return res.status(400).json({ errorMessage: err.message ?? '비정상적인 요청입니다.' });
    }
  }
};