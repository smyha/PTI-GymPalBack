-- ============================================================================
-- AI CHAT FEATURE
-- ============================================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS ai_messages CASCADE;
DROP TABLE IF EXISTS ai_conversations CASCADE;

-- AI Conversations
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Messages
CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_updated_at ON ai_conversations(updated_at);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created_at ON ai_messages(created_at);

-- Trigger for updated_at on conversations
CREATE TRIGGER update_ai_conversations_updated_at 
BEFORE UPDATE ON ai_conversations 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update conversation updated_at when new message is added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ai_conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_timestamp_trigger
AFTER INSERT ON ai_messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- RLS Policies
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
    ON ai_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
    ON ai_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
    ON ai_conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
    ON ai_conversations FOR DELETE
    USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages from their conversations"
    ON ai_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ai_conversations c
            WHERE c.id = ai_messages.conversation_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages into their conversations"
    ON ai_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_conversations c
            WHERE c.id = ai_messages.conversation_id
            AND c.user_id = auth.uid()
        )
    );

