import json, urllib.request

with open('e:/nfBTI/nfbti-app/src/data/knowledgeBase.ts', 'r', encoding='utf-8') as f:
    system_prompt = f.read()

start = system_prompt.find('export const nftiSystemPrompt = `')
end = system_prompt.rfind('`\n\n// 为特定人格生成精简上下文')
system_content = system_prompt[start+33:end]

req = urllib.request.Request(
    'https://xplt.sdu.edu.cn:4000/v1/chat/completions',
    data=json.dumps({
        'model': 'SDU-AI/DeepSeek-V4-Flash',
        'messages': [
            {'role': 'system', 'content': system_content},
            {'role': 'user', 'content': '用户测试结果：GENIUS · 985er（RGLS）\n测试模式：完整测试（48题）\n一句话描述：不少人来骚扰说你卷——其实你只是享受每一步都踩在计划上的踏实感。\n\n四维得分：\n社交电量：R (18分差距)\n信息偏好：G (14分差距)\n决策风格：L (16分差距)\n生活节奏：S (12分差距)\n\n人格详情：你是南方校园里最"硬核"的学习者。你的笔记是班级里的传家宝——彩色标记、思维导图、易错点总结、历年真题归类，比教辅书还全面。寒暑假作业答案在你手里是"硬通货"，但你从不随便给，因为你觉得"给了也是害TA"。你的书桌永远整洁，每样东西都有固定位置；你的时间表精确到分钟，连上厕所都预留了五分钟。你不擅长社交，但你擅长观察——你知道哪位老师喜欢提前五分钟进教室，知道哪天的食堂人最少，知道图书馆哪段时间最可能开门。你的情绪稳定得像一台精密仪器，很少大喜大悲。你是那种会在考试前一天晚上，把错题本再看一遍、把文具检查两遍、把准考证放三个地方的人，虽然你知道自己不可能忘。\n\n用户提问：我是 RGLS（985er），最近发现室友总在背后说我"卷"，还在班级群里阴阳我。我知道自己只是喜欢按计划做事，但听到这些很难受。我该怎么处理这种人际关系？'}
        ],
        'temperature': 0.7
    }).encode(),
    headers={'Content-Type': 'application/json', 'Authorization': 'Bearer sk-CfB-p2wQQvMk010ZWxm9WA'}
)
resp = urllib.request.urlopen(req, timeout=60)
print(resp.read().decode())
