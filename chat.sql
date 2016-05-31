USE chat;

DELIMITER $$

CREATE DEFINER=`root`@`localhost` PROCEDURE `chat_getnotes`(
  in from_user_id int
)
BEGIN
    SELECT count(id) as count, message.conversationId from message where message.read = false and message.fromUserId <> from_user_id group by conversationId;
END

DELIMITER $$
CREATE DEFINER='root'@'localhost' PROCEDURE 'chat_getmsgs'()
BEGIN
    SELECT * from message;
END

DELIMITER $$

CREATE DEFINER=root@localhost PROCEDURE chat_insert_msg(
    out msg_id int,
    in content text,
    in type varchar(50),
    in conversationId text,
    in fromUserId int
)
BEGIN
    INSERT INTO message(content, type, conversationId, fromUserId)
    values(content, type, conversationId, fromUserId);
    set msg_id = LAST_INSERT_ID();
END

DELIMITER $$

CREATE PROCEDURE `count_msg`(out count_msg int)
BEGIN
    select count(`id`) into count_msg from message;
END

call count_msg(@out);
select @out;


