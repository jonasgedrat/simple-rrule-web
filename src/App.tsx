import { useState, useEffect } from 'react'
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form'
import { addDays, addHours, formatISO9075 } from 'date-fns'
import {
    expandRRuleFromString,
    Frequency,
    getRRuleString,
    IExpandResult,
    ISchedulerEditor,
    schedulerEditorDefaultValues,
    parseRecurrenceFromString,
} from 'simple-rrule'
import {
    Button,
    Container,
    Divider,
    Group,
    List,
    Modal,
    MultiSelect,
    SegmentedControl,
    Space,
    Switch,
    Text,
    Textarea,
    TextInput,
    Title,
} from '@mantine/core'

const today = new Date()
const startDt = new Date(
    today.getUTCFullYear(),
    today.getMonth(),
    today.getDate(),
    today.getUTCHours(),
    30
)

const App = () => {
    const [showFormValues, setShowFormValues] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [showModal2, setShowModal2] = useState(false)
    const [rRuleString, setRRuleString] = useState('')
    const [myRruleString, setMyRruleString] = useState('')

    const [expandResult, setExpandResult] = useState<IExpandResult | undefined>(
        undefined
    )

    const methods = useForm({
        defaultValues: {
            ...schedulerEditorDefaultValues,
            dtStart: startDt,
            dtEnd: addHours(startDt, 1),
            frequency: Frequency.DAILY,
            count: 7,
        },
        mode: 'all',
    })

    const store = methods.watch()

    useEffect(() => {
        //setExpandResult(undefined)
        setRRuleString(getRRuleString(store))

        return () => {
            setRRuleString('')
        }
    }, [store])

    const onSubmit: SubmitHandler<ISchedulerEditor> = (
        formData: ISchedulerEditor
    ) => {
        console.log('formData', formData)

        if (formData.count === 0 && !formData.until) {
            formData.count = 120
        }

        const r = expandRRuleFromString(
            getRRuleString(formData),
            addDays(store.dtStart, -1),
            addDays(store.dtStart, 120)
        )

        console.log(r)
        setExpandResult(r)

        setShowModal(true)
    }

    const handleChangeFrequency = (newValue: Frequency) => {
        if (newValue === store.frequency) return
        methods.setValue('frequency', newValue)
        methods.setValue('byDay', '')
        methods.setValue('bySetPos', 0)
        methods.setValue('byMonth', 0)
        methods.setValue('byMonthDay', 0)
        methods.setValue('interval', 1)
        methods.setValue('count', 7)
        methods.setValue('until', undefined)
        setMyRruleString('')
    }

    const handleChangeMyRruleString = () => {
        setShowModal2(false)
        try {
            const parsedRrule = parseRecurrenceFromString(myRruleString)
            console.log(parsedRrule)
            methods.reset({
                ...schedulerEditorDefaultValues,
                ...parsedRrule,
            })
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <Container className="App">
            <Title order={1}>Simple-Rrule </Title>

            <Space h="lg" />
            <Divider my="sm" />
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <div>
                        <Text fw={500}>Frequency</Text>
                        <SegmentedControl
                            color="blue"
                            value={methods.getValues('frequency')}
                            onChange={(e: Frequency) => {
                                handleChangeFrequency(e)
                            }}
                            data={[
                                { value: 'YEARLY', label: 'YEARLY' },
                                { value: 'MONTHLY', label: 'MONTHLY' },
                                { value: 'WEEKLY', label: 'WEEKLY' },
                                { value: 'DAILY', label: 'DAILY' },
                                { value: 'HOURLY', label: 'HOURLY' },
                                {
                                    value: 'MINUTELY',
                                    label: 'MINUTELY',
                                },
                                {
                                    value: 'SECONDLY',
                                    label: 'SECONDLY',
                                    disabled: true,
                                    //not implemented
                                },
                            ]}
                        />
                    </div>
                    <Space h="lg" />
                    <Group position="apart">
                        <TextInput
                            withAsterisk
                            label="dtStart"
                            name="dtStart"
                            type="datetime-local"
                            value={formatISO9075(methods.getValues('dtStart'))}
                            onChange={(e) => {
                                methods.setValue(
                                    'dtStart',
                                    new Date(e.target.value)
                                )
                            }}
                        />
                        <TextInput
                            label="dtEnd"
                            description="only for event duration"
                            name="dtEnd"
                            type="datetime-local"
                            value={formatISO9075(methods.getValues('dtEnd'))}
                            onChange={(e) => {
                                methods.setValue(
                                    'dtEnd',
                                    new Date(e.target.value)
                                )
                            }}
                        />
                        <TextInput
                            withAsterisk
                            label="Interval"
                            name="interval"
                            type="number"
                            step={1}
                            min={1}
                            value={methods.getValues('interval')}
                            onChange={(e) => {
                                methods.setValue(
                                    'interval',
                                    Number(e.target.value)
                                )
                            }}
                        />
                    </Group>
                    <Space h="lg" />
                    {store.frequency === Frequency.WEEKLY && (
                        <MultiSelect
                            withAsterisk
                            clearable
                            value={methods.getValues('byDay').split(',')}
                            onChange={(e) =>
                                methods.setValue('byDay', e.toString())
                            }
                            data={[
                                { label: 'Sunday', value: 'SU' },
                                { label: 'Monday', value: 'MO' },
                                { label: 'Tuesday', value: 'TU' },
                                { label: 'Wednesday', value: 'WE' },
                                { label: 'Thursday', value: 'TH' },
                                { label: 'Friday', value: 'FR' },
                                { label: 'Saturday', value: 'SA' },
                            ]}
                            label="WeekDays"
                        />
                    )}
                    <Space h="lg" />
                    <Group position="apart">
                        <TextInput
                            description="Count=0 enable Until Date"
                            label="Count"
                            name="count"
                            type="number"
                            step={1}
                            min={0}
                            value={methods.getValues('count')}
                            onChange={(e) => {
                                const newValue = Number(e.target.value)
                                methods.setValue('count', newValue)
                                // if(newValue===0)
                                methods.setValue('until', undefined)
                            }}
                        />
                        {store.count === 0 && (
                            <TextInput
                                label="Until"
                                name="until"
                                type="datetime-local"
                                value={
                                    store.until
                                        ? formatISO9075(store.until)
                                        : undefined
                                }
                                onChange={(e) => {
                                    methods.setValue(
                                        'until',
                                        new Date(e.target.value)
                                    )
                                    methods.setValue('count', 0)
                                }}
                            />
                        )}
                        <Text size={'sm'}>
                            Examples with byMonth--byMonthDay--bySetPos only in
                            test folder
                        </Text>
                    </Group>
                    <Space h="lg" /> <Space h="lg" />
                    <Group position="center">
                        <Button type="submit">Submit</Button>
                        <Switch
                            label="Show form values JSON"
                            checked={showFormValues}
                            onChange={() => setShowFormValues(!showFormValues)}
                        />
                    </Group>
                </form>
            </FormProvider>

            {/* Function getRRuleString() */}
            <div>
                <Space h="lg" />
                <Divider my="sm" />
                {showFormValues && <pre>{JSON.stringify(store, null, 2)}</pre>}
                <Space h="lg" />
                <Title order={4}>Function getRRuleString()</Title>
                <Title order={6}>returns rRule string from form values:</Title>
                <Space h="lg" />
                {rRuleString}
            </div>

            {/* Function parseRecurrenceFromString() */}
            <div>
                <Space h="lg" />
                <Divider my="sm" />
                <Title order={4}>Function parseRecurrenceFromString():</Title>
                <Button
                    onClick={() => {
                        setMyRruleString(rRuleString)
                        setShowModal2(true)
                    }}
                >
                    Input myrRule String
                </Button>
                <Modal
                    size={'auto'}
                    opened={showModal2}
                    onClose={() => setShowModal2(false)}
                >
                    <Space h="lg" />
                    <Title order={4}>
                        Function parseRecurrenceFromString():
                    </Title>
                    <Textarea
                        minRows={7}
                        name="myRruleString"
                        value={myRruleString}
                        onChange={(e) => setMyRruleString(e.target.value)}
                        label="Input your rRule string"
                        description="result/errors on console"
                        placeholder="format: DTSTART:...  newline  DTEND:...  newline  RRULE:..."
                    />
                    <Space h="lg" />
                    Example:
                    <Space h="sm" />
                    <code>
                        DTSTART:20221210T183000Z/nDTEND:20221210T193000Z/nRRULE:FREQ=DAILY;INTERVAL=1;COUNT=7;WKST=SU
                    </code>
                    <Space h="lg" />
                    <Group position="center">
                        <Button onClick={handleChangeMyRruleString}>Ok</Button>
                        <Button
                            color={'gray'}
                            onClick={() => setShowModal2(false)}
                        >
                            Cancel
                        </Button>
                    </Group>
                </Modal>
            </div>

            {/* Modal Form Submit Result */}
            <Modal
                size={'auto'}
                opened={showModal}
                onClose={() => setShowModal(false)}
            >
                <Space h="lg" />
                <Title order={4}>Returns IExpandResult Events:</Title>
                <Space h="lg" />

                <Group position="apart">
                    <div>
                        <Title order={5}>ExpanResult.Events</Title>
                        {expandResult && expandResult.events.length > 0 && (
                            <List>
                                {expandResult.events.map((x) => (
                                    <List.Item key={x.index}>
                                        {`${x.index} - ${x.date.toISOString()}`}
                                    </List.Item>
                                ))}
                            </List>
                        )}
                    </div>

                    <div>
                        <Title order={5}>ExpanResult.r</Title>
                        <pre>{JSON.stringify(expandResult?.r, null, 2)}</pre>
                    </div>
                </Group>
            </Modal>
        </Container>
    )
}

export default App

