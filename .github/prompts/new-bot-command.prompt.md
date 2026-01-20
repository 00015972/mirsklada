# Create New Telegram Bot Command

Create a new grammY bot command following the mirsklada patterns.

## Requirements
- Use the command/conversation pattern from `grammy-bot.skill.md`
- Include proper error handling
- Add i18n translations (ru, en, uz)
- Verify tenant access via middleware
- Check subscription tier for Pro features

## I need:
1. **Command name**: (e.g., "/stock", "/add", "/debt")
2. **Bot type**: (admin-bot or client-bot)
3. **Flow**: (simple response or multi-step conversation?)
4. **API calls**: (which backend endpoints does it need?)

## Generate:
- [ ] Command handler in `apps/bot-{type}/src/commands/`
- [ ] Conversation in `apps/bot-{type}/src/conversations/` (if multi-step)
- [ ] Keyboard in `apps/bot-{type}/src/keyboards/` (if needed)
- [ ] Translation strings in `apps/bot-{type}/locales/`
